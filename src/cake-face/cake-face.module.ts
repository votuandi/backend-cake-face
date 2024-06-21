import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { CakeFaceEntity } from './cake-face.entity'
import { CakeFaceOptionEntity } from 'src/cake-face-option/cake-face-option.entity'
import { CakeFaceCategoryEntity } from 'src/cake-face-category/cake-face-category.entity'
import { CakeFaceController } from './cake-face.controller'
import { CakeFaceService } from './cake-face.service'
import { CakeFaceOptionService } from 'src/cake-face-option/cake-face-option.service'
import { CakeFaceCategoryService } from 'src/cake-face-category/cake-face-category.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([CakeFaceEntity, CakeFaceOptionEntity, CakeFaceCategoryEntity]),
  ],
  controllers: [CakeFaceController],
  providers: [CakeFaceService, CakeFaceOptionService, CakeFaceCategoryService],
})
export class CakeFaceModule {}
