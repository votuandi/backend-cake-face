import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { SamplePatternEntity } from './sample-pattern.entity'
import { SamplePatternController } from './sample-pattern.controller'
import { SamplePatternService } from './sample-pattern.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([SamplePatternEntity]),
  ],
  controllers: [SamplePatternController],
  providers: [SamplePatternService],
})
export class SamplePatternModule {}
