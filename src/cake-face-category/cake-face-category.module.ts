import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { CakeFaceEntity } from 'src/cake-face/cake-face.entity'
import { CakeFaceCategoryEntity } from './cake-face-category.entity'
import { CakeFaceCategoryController } from './cake-face-category.controller'
import { CakeFaceService } from 'src/cake-face/cake-face.service'
import { CakeFaceCategoryService } from './cake-face-category.service'
import { CakeFaceOptionEntity } from 'src/cake-face-option/cake-face-option.entity'
import { CakeFaceOptionService } from 'src/cake-face-option/cake-face-option.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([CakeFaceEntity, CakeFaceCategoryEntity, CakeFaceOptionEntity]),
  ],
  controllers: [CakeFaceCategoryController],
  providers: [CakeFaceService, CakeFaceCategoryService, CakeFaceOptionService],
})
export class CakeFaceCategoryModule {}
