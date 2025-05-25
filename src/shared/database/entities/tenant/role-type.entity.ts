import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../base/base.entity';
import { Role } from './role.entity';

export enum RoleTypeCode {
  CLIENT = 'CLIENT',
  COACH = 'COACH',
  COACH_MEMBER = 'COACH_MEMBER',
  STUDIO_COACH = 'STUDIO_COACH',
  STUDIO_OWNER = 'STUDIO_OWNER',
  STUDIO_MEMBER = 'STUDIO_MEMBER',
  GYM_COACH = 'GYM_COACH',
  GYM_OWNER = 'GYM_OWNER',
  GYM_MEMBER = 'GYM_MEMBER',
}

export enum RoleLevel {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  MANAGER = 'MANAGER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum RoleCategory {
  CLIENT = 'CLIENT',
  COACH = 'COACH',
  STUDIO = 'STUDIO',
  GYM = 'GYM',
  SYSTEM = 'SYSTEM',
}

@Entity('role_types')
@Index(['code'], { unique: true })
export class RoleType extends BaseEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: RoleTypeCode,
    unique: true,
  })
  code!: RoleTypeCode;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: RoleLevel,
    default: RoleLevel.BASIC,
  })
  level!: RoleLevel;

  @Column({
    type: 'enum',
    enum: RoleCategory,
  })
  category!: RoleCategory;

  @Column({ default: true })
  isActive!: boolean;

  // Relations
  @OneToMany(() => Role, (role) => role.roleType)
  roles!: Role[];
}
