import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from './users.controller'
import { UserService } from './users.service'
import { UserEntity } from './entities/user.entity'
import { UserInformationEntity } from './entities/user-information.entity'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([UserEntity, UserInformationEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
