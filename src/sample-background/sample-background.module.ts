import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { SampleBackgroundEntity } from './sample-background.entity'
import { SampleBackgroundController } from './sample-background.controller'
import { SampleBackgroundService } from './sample-background.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([SampleBackgroundEntity]),
  ],
  controllers: [SampleBackgroundController],
  providers: [SampleBackgroundService],
})
export class SampleBackgroundModule {}
