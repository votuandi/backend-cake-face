import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator'
import { Role } from '../../auth/roles.enum'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  userName: string

  @IsString()
  @IsNotEmpty()
  password: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  address: string

  @IsEmail()
  @IsOptional()
  email: string

  @IsString()
  @IsNotEmpty()
  phoneNumber: string

  // @IsString()
  // @IsNotEmpty()
  // avatar: string

  @IsString()
  @IsOptional()
  note: string

  @IsString()
  @IsNotEmpty()
  role: Role = Role.USER

  @IsString()
  @IsNotEmpty()
  isActive: '1' | '0'
}
