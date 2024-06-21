import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { CakeFaceEntity } from 'src/cake-face/cake-face.entity'
import { CakeFaceOptionEntity } from './cake-face-option.entity'
import { CakeFaceOptionController } from './cake-face-option.controller'
import { CakeFaceOptionService } from './cake-face-option.service'
import { CakeFaceService } from 'src/cake-face/cake-face.service'
import { CakeFaceCategoryEntity } from 'src/cake-face-category/cake-face-category.entity'
import { CakeFaceCategoryService } from 'src/cake-face-category/cake-face-category.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([CakeFaceEntity, CakeFaceOptionEntity, CakeFaceCategoryEntity]),
  ],
  controllers: [CakeFaceOptionController],
  providers: [CakeFaceOptionService, CakeFaceService, CakeFaceCategoryService],
})
export class CakeFaceOptionModule {}
