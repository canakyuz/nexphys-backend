import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsObject, MinLength, MaxLength } from 'class-validator';
import { UserStatus } from '@/shared/database/entities/tenant/user.entity';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsObject()
  profile?: Record<string, any>;
}
