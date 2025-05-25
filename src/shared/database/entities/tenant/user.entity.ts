// src/shared/database/entities/tenant/user.entity.ts - Import düzeltmesi
import {
  Entity,
  Column,
  ManyToOne,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Exclude } from "class-transformer";
import * as bcrypt from "bcryptjs";
import { BaseEntity } from "../base/base.entity"; // Doğru path
import { Role } from "./role.entity"; // Doğru path

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
}

@Entity("users")
@Index(["email"], { unique: true })
export class User extends BaseEntity {
  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password!: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ nullable: true, type: "date" })
  dateOfBirth?: Date;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: "jsonb", nullable: true })
  profile?: Record<string, any>;

  @Column({ type: "timestamp with time zone", nullable: true })
  lastLoginAt?: Date;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ type: "timestamp with time zone", nullable: true })
  passwordResetExpires?: Date;

  // Relations
  @ManyToOne(() => Role, (role) => role.users, {
    eager: true,
    onDelete: "SET NULL",
  })
  role?: Role;

  @Column({ name: "role_id", nullable: true })
  roleId?: string;

  // Password hashing hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith("$2a$")) {
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
      (permission: any) =>
        permission.resource === resource &&
        permission.action === action &&
        permission.isActive,
    );
  }

  isOwner(): boolean {
    return this.role?.roleType?.level === "OWNER";
  }

  isManager(): boolean {
    const level = this.role?.roleType?.level;
    return level === "MANAGER" || level === "OWNER";
  }
}