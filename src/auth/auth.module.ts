import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '../users/entities/user.entity'
import { UserInformationEntity } from '../users/entities/user-information.entity'
import { AuthInterceptor } from './interceptors/auth.interceptor'
import { PassportModule } from '@nestjs/passport'
import { UserService } from 'src/users/users.service'
import { JwtStrategy } from './jwt.strategy'
import { AuthController } from './auth.controller'

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, UserInformationEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, ConfigService, AuthInterceptor, UserService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
