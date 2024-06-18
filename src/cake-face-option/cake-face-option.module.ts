import { Module } from '@nestjs/common'
import { ArticleService } from './article.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ArticleEntity } from 'src/entities/article.entity'
import { ArticleController } from './article.controller'
import { CategoryService } from '../category/category.service'
import { CategoryEntity } from 'src/entities/category.entity'
import { ArticleContentEntity } from 'src/entities/article-content.entity'
import { ArticleContentService } from '../article-content/article-content.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([ArticleEntity, ArticleContentEntity, CategoryEntity])],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleContentService, CategoryService],
})
export class ArticleModule {}
