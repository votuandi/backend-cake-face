import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { join } from 'path'
import { generateRandomString } from 'src/utils/helpers/common.helpers'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import { CreateCakeFaceCategoryDto } from './dto/create-cake-face-category.dto'
import { UpdateCakeFaceCategoryDto } from './dto/update-cake-face-category.dto'
import { CakeFaceCategoryEntity } from './cake-face-category.entity'

@Injectable()
export class CakeFaceCategoryService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(CakeFaceCategoryEntity)
    private readonly cakeFaceCategoryRepository: Repository<CakeFaceCategoryEntity>,
  ) {}

  async create(
    createCategoryDto: CreateCakeFaceCategoryDto,
    creator: string,
    thumbnail: Express.Multer.File | undefined,
  ): Promise<CakeFaceCategoryEntity | null> {
    try {
      console.log('DTO_CREATE_CATEGORY:', createCategoryDto)

      let createTime = new Date()
      let thumbnailPath = await this.saveThumbnail(createTime.getTime(), thumbnail)

      let newCategoryData = {
        ...createCategoryDto,
        createTime: createTime,
        thumbnail: thumbnailPath,
        isActive: createCategoryDto.isActive === '1',
        createDate: createTime,
        createBy: creator,
        updateDate: createTime,
        updateBy: creator,
      }
      let category = this.cakeFaceCategoryRepository.create(newCategoryData)
      return await this.cakeFaceCategoryRepository.save(category)
    } catch (error) {
      console.log('ERROR_CREATE_CATEGORY:', error)

      return null
    }
  }

  async findAll(): Promise<CakeFaceCategoryEntity[] | null> {
    try {
      let categoryList = await this.cakeFaceCategoryRepository.find({
        order: {
          createDate: 'ASC',
        },
      })
      let newCategoryList: CakeFaceCategoryEntity[] = []
      categoryList.forEach((cate) => {
        let newCategory: CakeFaceCategoryEntity = {
          ...cate,
          thumbnail: `${this.configService.get('API_HOST')}/${cate.thumbnail}`,
        }
        newCategoryList.push(newCategory)
      })
      return newCategoryList
    } catch (error) {
      return null
    }
  }

  async findOne(id: number): Promise<CakeFaceCategoryEntity | undefined | null> {
    try {
      return await this.cakeFaceCategoryRepository.findOne({ where: { id } })
    } catch (error) {
      return null
    }
  }

  async update(
    categoryId: number,
    updateCategoryDto: UpdateCakeFaceCategoryDto,
    updater: string,
    thumbnail: Express.Multer.File | undefined,
  ): Promise<CakeFaceCategoryEntity | null> {
    try {
      console.log('DTO_UPDATE_CATEGORY', updateCategoryDto)
      console.log('thumbnail', thumbnail)

      let currentCategory = await this.cakeFaceCategoryRepository.findOne({ where: { id: categoryId } })
      if (!currentCategory) {
        return null
      }

      let updateTime = new Date()

      let { id, ...oldData } = currentCategory
      console.log('update Category with id = ', id)

      let newThumbnailPath = oldData.thumbnail
      if (thumbnail) {
        newThumbnailPath = await this.saveThumbnail(updateTime.getTime(), thumbnail)
        if (!newThumbnailPath) {
          return null
        }
      }

      let updatedCategory = {
        ...oldData,
        ...updateCategoryDto,
        thumbnail: newThumbnailPath,
        updateDate: updateTime,
        updateBy: updater,
        isActive: updateCategoryDto.isActive ? updateCategoryDto.isActive === '1' : oldData.isActive,
      }
      let updateRes = await this.cakeFaceCategoryRepository.update(categoryId, updatedCategory)
      if (updateRes.affected > 0) {
        await this.removeOldThumbnail(oldData.thumbnail)
      }
      return this.cakeFaceCategoryRepository.findOne({ where: { id: categoryId } })
    } catch (error) {
      console.log('ERROR:', error)
      return null
    }
  }

  async remove(id: string): Promise<number> {
    try {
      console.log('User want to remove category id =', id)

      return 0
    } catch (error) {
      console.log(error)
      return -1
    }
  }

  private async saveThumbnail(time: string | number, thumbnailFile: Express.Multer.File) {
    if (thumbnailFile) {
      let savedAvatarName = `cfc_${time}_${generateRandomString(10)}.${
        thumbnailFile.originalname.split('.').reverse()[0]
      }`
      let savedThumbnailPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face-category', savedAvatarName)
      try {
        const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face-category')
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true })
        }
        fs.writeFileSync(savedThumbnailPath, thumbnailFile.buffer)
      } catch (error) {
        console.log('Error when saving image: ', error)
        return null
      }
    } else return join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face-category', 'default.png')
  }

  private async removeOldThumbnail(path: string) {
    try {
      await fs.promises.unlink(path)
    } catch (error) {
      console.log('ERROR DELETE OLD THUMBNAIL:', error)
    }
  }
}
