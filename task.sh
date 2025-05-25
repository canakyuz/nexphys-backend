# Role Entity'sini tamamla
cat > src/shared/database/entities/tenant/role.entity.ts << 'EOF'
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base/base.entity';
import { RoleType } from './role-type.entity';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity('roles')
@Index(['name', 'roleTypeId'], { unique: true })
export class Role extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => RoleType, (roleType) => roleType.roles, {
    onDelete: 'CASCADE',
  })
  roleType: RoleType;

  @Column({ name: 'role_type_id' })
  roleTypeId: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions: Permission[];
}
EOF

# User Entity'sini tamamla
cat > src/shared/database/entities/tenant/user.entity.ts << 'EOF'
import {
  Entity,
  Column,
  ManyToOne,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { BaseEntity } from '../base/base.entity';
import { Role } from './role.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth?: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'jsonb', nullable: true })
  profile?: Record<string, any>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  passwordResetExpires?: Date;

  // Relations
  @ManyToOne(() => Role, (role) => role.users, {
    eager: true,
    onDelete: 'SET NULL',
  })
  role: Role;

  @Column({ name: 'role_id', nullable: true })
  roleId?: string;

  // Password hashing hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  hasPermission(resource: string, action: string): boolean {
    if (!this.role?.permissions) return false;
    return this.role.permissions.some(
      (permission) =>
        permission.resource === resource &&
        permission.action === action &&
        permission.isActive,
    );
  }

  isOwner(): boolean {
    return this.role?.roleType?.level === 'OWNER';
  }

  isManager(): boolean {
    return ['MANAGER', 'OWNER'].includes(this.role?.roleType?.level);
  }
}
EOF

