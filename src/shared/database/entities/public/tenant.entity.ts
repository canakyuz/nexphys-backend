import {
  Entity,
  Column,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from '../base/base.entity';
import { Subscription } from './subscription.entity';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
}

export enum TenantType {
  GYM = 'GYM',
  STUDIO = 'STUDIO',
  PERSONAL_TRAINER = 'PERSONAL_TRAINER',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('tenants', { schema: 'public' })
@Index(['domain'], { unique: true })
@Index(['schemaName'], { unique: true })
export class Tenant extends BaseEntity {
  @Column({ length: 200 })
  name!: string;

  @Column({ length: 100, unique: true })
  domain!: string;

  @Column({ name: 'schema_name', length: 63, unique: true })
  schemaName!: string;

  @Column({
    type: 'enum',
    enum: TenantType,
    default: TenantType.GYM,
  })
  tenantType!: TenantType;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status!: TenantStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: {
    timezone?: string;
    currency?: string;
    language?: string;
    features?: string[];
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  contact?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndDate?: Date;

  @Column({ default: false })
  isSchemaCreated!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastAccessAt?: Date;

  // Relations
  @OneToMany(() => Subscription, (subscription) => subscription.tenant)
  subscriptions!: Subscription[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  generateSchemaName() {
    if (!this.schemaName) {
      const cleanDomain = this.domain.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const randomId = Math.random().toString(36).substring(2, 8);
      this.schemaName = `tenant_${cleanDomain}_${randomId}`;
    }
  }

  // Methods
  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE;
  }

  get isTrial(): boolean {
    return this.status === TenantStatus.TRIAL;
  }

  get isTrialExpired(): boolean {
    if (!this.trialEndDate) return false;
    return new Date() > this.trialEndDate;
  }

  get daysUntilTrialExpires(): number {
    if (!this.trialEndDate) return 0;
    const diff = this.trialEndDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
