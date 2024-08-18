import { Module } from '@nestjs/common'
import { SettingController } from './setting.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SettingService } from './setting.service'
import { ConfigModule } from '@nestjs/config'
import { SettingEntity } from './setting.entity'

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([SettingEntity])],
  controllers: [SettingController],
  providers: [SettingService],
})
export class SettingModule {}
