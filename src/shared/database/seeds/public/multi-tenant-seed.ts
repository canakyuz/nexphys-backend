// src/shared/database/seeds/public/multi-tenant-seed.ts
import { PublicDataSource } from '../../config/public-connection';
import { Tenant, TenantType, TenantStatus } from '../../entities/public/tenant.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../entities/public/subscription.entity';
import { logger } from '@/shared/utils/logger.util';

export async function seedMultipleTenants() {
  try {
    logger.info('🌱 Seeding multiple tenant types...');

    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
    }

    const tenantRepository = PublicDataSource.getRepository(Tenant);
    const subscriptionRepository = PublicDataSource.getRepository(Subscription);

    // Tenant configurations for different business types
    const tenantConfigs = [
      {
        // Traditional Gym
        name: 'FitMax Gym',
        domain: 'fitmax-gym',
        tenantType: TenantType.GYM,
        description: 'Traditional fitness center with equipment and group classes',
        contact: {
          email: 'admin@fitmax-gym.com',
          phone: '+1-555-0101',
          address: {
            street: '123 Fitness St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US'
          }
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          features: ['equipment_booking', 'group_classes', 'personal_training', 'locker_rental'],
          branding: {
            primaryColor: '#FF6B35',
            secondaryColor: '#004E89'
          }
        },
        subscription: {
          plan: SubscriptionPlan.PREMIUM,
          monthlyPrice: 99.99,
          features: {
            maxUsers: 1000,
            maxGyms: 3,
            maxStorage: 5000,
            customBranding: true,
            apiAccess: true,
            advancedReporting: true
          }
        }
      },
      {
        // Yoga/Pilates Studio
        name: 'Zen Yoga Studio',
        domain: 'zen-yoga',
        tenantType: TenantType.STUDIO,
        description: 'Boutique yoga and pilates studio with mindfulness focus',
        contact: {
          email: 'namaste@zen-yoga.com',
          phone: '+1-555-0102',
          address: {
            street: '456 Peaceful Ave',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US'
          }
        },
        settings: {
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          language: 'en',
          features: ['class_booking', 'meditation_sessions', 'wellness_tracking', 'community_events'],
          branding: {
            primaryColor: '#7B9F35',
            secondaryColor: '#2C5530'
          }
        },
        subscription: {
          plan: SubscriptionPlan.BASIC,
          monthlyPrice: 49.99,
          features: {
            maxUsers: 200,
            maxGyms: 1,
            maxStorage: 1000,
            customBranding: false,
            apiAccess: false,
            advancedReporting: false
          }
        }
      },
      {
        // Personal Trainer
        name: 'Elite Personal Training',
        domain: 'elite-pt',
        tenantType: TenantType.PERSONAL_TRAINER,
        description: 'Premium 1-on-1 personal training services',
        contact: {
          email: 'coach@elite-pt.com',
          phone: '+1-555-0103',
          address: {
            street: '789 Training Blvd',
            city: 'Miami',
            state: 'FL',
            postalCode: '33101',
            country: 'US'
          }
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          features: ['client_management', 'workout_programming', 'progress_tracking', 'nutrition_coaching'],
          branding: {
            primaryColor: '#000000',
            secondaryColor: '#FFD700'
          }
        },
        subscription: {
          plan: SubscriptionPlan.PREMIUM,
          monthlyPrice: 79.99,
          features: {
            maxUsers: 50,
            maxGyms: 1,
            maxStorage: 2000,
            customBranding: true,
            apiAccess: true,
            advancedReporting: true
          }
        }
      },
      {
        // Enterprise/Corporate
        name: 'TechCorp Wellness',
        domain: 'techcorp-wellness',
        tenantType: TenantType.ENTERPRISE,
        description: 'Corporate wellness program for tech companies',
        contact: {
          email: 'wellness@techcorp.com',
          phone: '+1-555-0104',
          address: {
            street: '101 Innovation Dr',
            city: 'Seattle',
            state: 'WA',
            postalCode: '98101',
            country: 'US'
          }
        },
        settings: {
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          language: 'en',
          features: ['employee_wellness', 'health_challenges', 'team_competitions', 'wellness_analytics'],
          branding: {
            primaryColor: '#0066CC',
            secondaryColor: '#66B2FF'
          }
        },
        subscription: {
          plan: SubscriptionPlan.ENTERPRISE,
          monthlyPrice: 299.99,
          features: {
            maxUsers: 5000,
            maxGyms: 10,
            maxStorage: 20000,
            customBranding: true,
            apiAccess: true,
            advancedReporting: true
          }
        }
      }
    ];

    // Create tenants and subscriptions
    for (const config of tenantConfigs) {
      // Check if tenant already exists
      const existingTenant = await tenantRepository.findOne({
        where: { domain: config.domain }
      });

      if (existingTenant) {
        logger.info(`Tenant already exists: ${config.domain}, skipping...`);
        continue;
      }

      // Create tenant
      const tenant = tenantRepository.create({
        name: config.name,
        domain: config.domain,
        tenantType: config.tenantType,
        description: config.description,
        contact: config.contact,
        settings: config.settings,
        status: TenantStatus.TRIAL,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isSchemaCreated: false
      });

      await tenantRepository.save(tenant);
      logger.info(`✅ Created tenant: ${tenant.name} (${tenant.domain})`);

      // Create subscription
      const subscription = subscriptionRepository.create({
        plan: config.subscription.plan,
        status: SubscriptionStatus.ACTIVE,
        monthlyPrice: config.subscription.monthlyPrice,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: config.subscription.features,
        tenant: tenant,
        tenantId: tenant.id
      });

      await subscriptionRepository.save(subscription);
      logger.info(`✅ Created subscription for: ${tenant.name}`);
    }

    logger.info('🎉 Multi-tenant seeding completed successfully');

    // Print summary
    const tenants = await tenantRepository.find();
    logger.info('\n📊 Tenant Summary:');
    tenants.forEach(tenant => {
      logger.info(`  • ${tenant.name} (${tenant.tenantType}): ${tenant.domain}`);
    });

  } catch (error) {
    logger.error('❌ Failed to seed multiple tenants:', error);
    throw error;
  }
}