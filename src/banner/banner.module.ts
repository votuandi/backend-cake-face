import { Module } from '@nestjs/common'
import { BannerController } from './banner.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BannerService } from './banner.service'
import { ConfigModule } from '@nestjs/config'
import { BannerEntity } from './banner.entity'

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([BannerEntity])],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}
