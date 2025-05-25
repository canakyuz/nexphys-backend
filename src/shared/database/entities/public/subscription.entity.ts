import {
  Entity,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base/base.entity';
import { Tenant } from './tenant.entity';

export enum SubscriptionPlan {
  TRIAL = 'TRIAL',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE',
}

@Entity('subscriptions', { schema: 'public' })
@Index(['tenantId', 'status'])
export class Subscription extends BaseEntity {
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan!: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  yearlyPrice?: number;

  @Column({ type: 'timestamp with time zone' })
  startDate!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextBillingDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  features?: {
    maxUsers?: number;
    maxGyms?: number;
    maxStorage?: number;
    customBranding?: boolean;
    apiAccess?: boolean;
    advancedReporting?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  limits?: {
    users?: number;
    gyms?: number;
    storage?: number;
  };

  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Column({ nullable: true })
  stripePriceId?: string;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.subscriptions, {
    onDelete: 'CASCADE',
  })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  // Methods
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  get isExpired(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
  }

  get daysUntilExpiry(): number {
    if (!this.endDate) return Infinity;
    const diff = this.endDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
