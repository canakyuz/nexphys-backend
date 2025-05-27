import { IsString, IsOptional, IsEnum, IsDateString, IsObject, MinLength, MaxLength } from 'class-validator';
import { UserStatus } from '@/shared/database/entities/tenant/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

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
  @IsObject()
  profile?: Record<string, any>;
}
