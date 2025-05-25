// src/shared/database/entities/tenant/permission.entity.ts - Düzeltilmiş versiyon
import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from '../base/base.entity';
import { Role } from './role.entity';

export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
}

@Entity('permissions')
@Index(['resource', 'action'], { unique: true })
export class Permission extends BaseEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  resource!: string;

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action!: PermissionAction;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, any>;

  @Column({ default: true })
  isActive!: boolean;

  // Relations
  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];
}