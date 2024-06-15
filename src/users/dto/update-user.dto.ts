import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator'
import { Role } from '../../auth/roles.enum'

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  address?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  phoneNumber?: string

  @IsString()
  @IsOptional()
  avatar?: string

  @IsString()
  @IsOptional()
  note: string

  @IsString()
  @IsOptional()
  role?: Role

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsString()
  @IsOptional()
  updateBy?: string
}
