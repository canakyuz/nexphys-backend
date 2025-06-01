# nexphys Backend - Deployment Guide

## 🎯 Deployment Options

### 1. Docker Compose (Recommended for Small-Medium Scale)
### 2. AWS ECS/Fargate (Recommended for Production)
### 3. Kubernetes (Enterprise Scale)

---

## 🐳 Docker Compose Deployment

### Production Setup

```bash
# 1. Clone repository on server
git clone <repository-url>
cd nexphys-backend

# 2. Create production environment
cp .env.example .env.production

# 3. Configure production values
nano .env.production
```

### Production Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=4000
API_PREFIX=/api/v1

# Database (Use managed database in production)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=nexphys_production
DB_USER=nexphys_user
DB_PASSWORD=STRONG_PRODUCTION_PASSWORD

# Security (CRITICAL: Change these!)
JWT_SECRET=SUPER_SECURE_JWT_SECRET_MIN_64_CHARS_FOR_PRODUCTION_USE
JWT_REFRESH_SECRET=SUPER_SECURE_REFRESH_SECRET_MIN_64_CHARS_FOR_PRODUCTION

# CORS (Restrict to your domains)
CORS_ORIGIN=https://app.nexphys.com,https://admin.nexphys.com
CORS_CREDENTIALS=true

# Redis (Use managed Redis in production)
REDIS_HOST=your-production-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis_production_password

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@nexphys.com

# File Storage
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
```

### Build and Deploy

```bash
# 1. Build production image
docker-compose -f docker-compose.yml build

# 2. Run database migrations
docker-compose run --rm api npm run migration:run:public
docker-compose run --rm api npm run seed:public

# 3. Start production services
docker-compose up -d

# 4. Verify deployment
curl https://your-domain.com/health
```

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: ./docker/Dockerfile
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    networks:
      - nexphys-network

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - nexphys-network
    # Remove port exposure in production (only internal access)

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - nexphys-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api
    networks:
      - nexphys-network

volumes:
  postgres_data:
  redis_data:

networks:
  nexphys-network:
    driver: bridge
```

---

## ☁️ AWS Deployment (Production Recommended)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Gateway                          │
├─────────────────────────────────────────────────────────────┤
│                Application Load Balancer                    │
├─────────────────────────────────────────────────────────────┤
│  ECS Fargate Service (Auto Scaling)                        │
│  ├── Task 1: nexphys API                                    │
│  ├── Task 2: nexphys API                                    │
│  └── Task 3: nexphys API                                    │
├─────────────────────────────────────────────────────────────┤
│  RDS PostgreSQL (Multi-AZ)                                 │
│  ElastiCache Redis Cluster                                 │
│  S3 Bucket (File Storage)                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1. Infrastructure Setup (Terraform)

```hcl
# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC and Networking
resource "aws_vpc" "nexphys_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "nexphys-vpc"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "nexphys_db" {
  identifier     = "nexphys-production"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"  # Adjust for production
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "nexphys_production"
  username = "nexphys_user"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.nexphys.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "nexphys-final-snapshot"

  tags = {
    Name = "nexphys-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "nexphys" {
  name       = "nexphys-cache-subnet"
  subnet_ids = [aws_subnet.private[0].id, aws_subnet.private[1].id]
}

resource "aws_elasticache_cluster" "nexphys_redis" {
  cluster_id           = "nexphys-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.nexphys.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name = "nexphys-redis"
  }
}

# S3 Bucket for file uploads
resource "aws_s3_bucket" "nexphys_uploads" {
  bucket = "nexphys-uploads-${random_string.bucket_suffix.result}"

  tags = {
    Name = "nexphys-uploads"
  }
}
```

### 2. ECS Service Configuration

```yaml
# aws/task-definition.json
{
  "family": "nexphys-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/nexphys-task-role",
  "containerDefinitions": [
    {
      "name": "nexphys-api",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexphys-backend:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "4000"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:nexphys/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:nexphys/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nexphys-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### 3. Deployment Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: nexphys-backend
  ECS_SERVICE: nexphys-api-service
  ECS_CLUSTER: nexphys-cluster

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        # Build Docker image
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
        
        # Push to ECR
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

    - name: Run database migrations
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        # Run migrations in ECS task
        aws ecs run-task \
          --cluster $ECS_CLUSTER \
          --task-definition nexphys-migration-task \
          --overrides '{
            "containerOverrides": [{
              "name": "nexphys-api",
              "command": ["npm", "run", "migration:run:public"]
            }]
          }' \
          --launch-type FARGATE \
          --network-configuration '{
            "awsvpcConfiguration": {
              "subnets": ["subnet-xxx", "subnet-yyy"],
              "securityGroups": ["sg-xxx"],
              "assignPublicIp": "DISABLED"
            }
          }'

    - name: Deploy to ECS
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        # Update task definition with new image
        aws ecs update-service \
          --cluster $ECS_CLUSTER \
          --service $ECS_SERVICE \
          --force-new-deployment
```

### 4. Load Balancer & SSL Setup

```yaml
# aws/alb-config.yml
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: nexphys-alb
    Scheme: internet-facing
    Type: application
    SecurityGroups:
      - !Ref ALBSecurityGroup
    Subnets:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2

HTTPSListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref APITargetGroup
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 443
    Protocol: HTTPS
    Certificates:
      - CertificateArn: !Ref SSLCertificate

# Health check configuration
TargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Name: nexphys-api-targets
    Port: 4000
    Protocol: HTTP
    VpcId: !Ref VPC
    TargetType: ip
    HealthCheckPath: /health
    HealthCheckProtocol: HTTP
    HealthCheckIntervalSeconds: 30
    HealthyThresholdCount: 2
    UnhealthyThresholdCount: 3
```

---

## 🔒 Security & SSL Setup

### 1. SSL Certificate (AWS Certificate Manager)

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name api.nexphys.com \
  --domain-name *.nexphys.com \
  --validation-method DNS \
  --region us-east-1

# Validate domain ownership (follow DNS instructions)
```

### 2. Security Groups

```yaml
# Security group for ALB
ALBSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for Application Load Balancer
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0

# Security group for ECS tasks
ECSSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for ECS tasks
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 4000
        ToPort: 4000
        SourceSecurityGroupId: !Ref ALBSecurityGroup
```

### 3. IAM Roles & Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:nexphys/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::nexphys-uploads-*/*"
      ]
    }
  ]
}
```

---

## 📊 Monitoring & Logging

### 1. CloudWatch Setup

```yaml
# CloudWatch Log Groups
LogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /ecs/nexphys-api
    RetentionInDays: 30

# CloudWatch Alarms
CPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: nexphys-high-cpu
    AlarmDescription: CPU utilization is too high
    MetricName: CPUUtilization
    Namespace: AWS/ECS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
```

### 2. Application Performance Monitoring

```typescript
// Add to your application
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Performance monitoring middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
```

---

## 🔄 Backup & Recovery

### 1. Automated Backups

```bash
#!/bin/bash
# scripts/backup-production.sh

# RDS automated backups are configured via Terraform
# Additional application-level backup

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="nexphys-backups"

# Export tenant schemas
aws ecs run-task \
  --cluster nexphys-cluster \
  --task-definition nexphys-backup-task \
  --overrides "{
    \"containerOverrides\": [{
      \"name\": \"nexphys-api\",
      \"command\": [\"node\", \"scripts/export-tenants.js\"],
      \"environment\": [{
        \"name\": \"BACKUP_DATE\",
        \"value\": \"$DATE\"
      }]
    }]
  }"

# Upload logs to S3
aws s3 sync /var/log/nexphys/ s3://$BACKUP_BUCKET/logs/$DATE/
```

### 2. Disaster Recovery Plan

```yaml
# Recovery procedure
1. Data Recovery:
   - Restore RDS from automated backup
   - Restore ElastiCache if needed
   - Restore S3 files from versioning

2. Application Recovery:
   - Deploy last known good image
   - Run health checks
   - Verify tenant access

3. DNS & Traffic:
   - Update Route 53 if needed
   - Monitor application metrics
   - Gradual traffic restoration
```

---

## 🚀 Scaling Strategies

### 1. Auto Scaling Configuration

```yaml
AutoScalingTarget:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    ServiceNamespace: ecs
    ResourceId: service/nexphys-cluster/nexphys-api-service
    ScalableDimension: ecs:service:DesiredCount
    MinCapacity: 2
    MaxCapacity: 20

AutoScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    PolicyName: nexphys-cpu-scaling
    PolicyType: TargetTrackingScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 70.0
      PredefinedMetricSpecification:
        PredefinedMetricType: ECSServiceAverageCPUUtilization
```

### 2. Database Scaling

```bash
# Read replicas for read-heavy workloads
aws rds create-db-instance-read-replica \
  --db-instance-identifier nexphys-read-replica \
  --source-db-instance-identifier nexphys-production

# Vertical scaling (during maintenance window)
aws rds modify-db-instance \
  --db-instance-identifier nexphys-production \
  --db-instance-class db.t3.medium \
  --apply-immediately
```

---

## ✅ Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificate validated
- [ ] Database migrations tested
- [ ] Backup strategy verified
- [ ] Monitoring alerts configured

### Security
- [ ] JWT secrets are strong (64+ chars)
- [ ] Database passwords are complex
- [ ] CORS origins restricted
- [ ] Security groups properly configured
- [ ] IAM roles follow least privilege

### Performance
- [ ] Connection pooling configured
- [ ] Auto-scaling policies set
- [ ] CDN configured for assets
- [ ] Database indexes optimized
- [ ] Redis caching enabled

### Monitoring
- [ ] CloudWatch logs configured
- [ ] Application metrics tracked
- [ ] Error tracking (Sentry) enabled
- [ ] Health checks working
- [ ] Alerting rules set up

### Backup & Recovery
- [ ] Automated RDS backups enabled
- [ ] Application data backup scheduled
- [ ] Recovery procedures documented
- [ ] Disaster recovery plan tested

---

**🚀 Your nexphys backend is now production-ready with enterprise-grade infrastructure!**