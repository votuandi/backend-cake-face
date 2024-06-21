import { CakeFaceCategoryEntity } from 'src/cake-face-category/cake-face-category.entity'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { join } from 'path'
import { generateRandomString } from 'src/utils/helpers/common.helpers'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import { CakeFaceEntity } from './cake-face.entity'
import { CakeFaceOptionEntity } from 'src/cake-face-option/cake-face-option.entity'
import { CreateCakeFaceDto } from './dto/create-cake-face.dto'
import { UpdateCakeFaceDto } from './dto/update-cake-face.dto'

@Injectable()
export class CakeFaceService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(CakeFaceCategoryEntity)
    private readonly categoryRepository: Repository<CakeFaceCategoryEntity>,
    @InjectRepository(CakeFaceEntity)
    private readonly cakeFaceRepository: Repository<CakeFaceEntity>,
    @InjectRepository(CakeFaceOptionEntity)
    private readonly optionRepository: Repository<CakeFaceOptionEntity>,
  ) {}

  async create(
    createCakeFaceDto: CreateCakeFaceDto,
    creator: string,
    thumbnail: Express.Multer.File,
    configFile: Express.Multer.File,
  ): Promise<CakeFaceEntity | null> {
    try {
      console.log('CREATE_CAKE_FACE_DTO:', createCakeFaceDto)

      let { categoryId, ...createCakeFaceData } = createCakeFaceDto

      let category = await this.categoryRepository.findOne({ where: { id: Number(categoryId) } })
      if (!category) return null

      let createTime = new Date()
      let thumbnailPath = await this.saveFile(createTime.getTime(), thumbnail)
      let configFilePath = await this.saveFile(createTime.getTime(), configFile)

      let newCakeFaceData = {
        ...createCakeFaceData,
        createTime: createTime,
        thumbnail: thumbnailPath,
        configFilePath: configFilePath,
        isActive: createCakeFaceData.isActive === '1',
        createDate: createTime,
        createBy: creator,
        updateDate: createTime,
        updateBy: creator,
        category,
      }

      let cakeFace = this.cakeFaceRepository.create(newCakeFaceData)
      return await this.cakeFaceRepository.save(cakeFace)
    } catch (error) {
      console.log('ERROR_CREATE_CAKE_FACE:', error)

      return null
    }
  }

  async findAll(): Promise<CakeFaceEntity[] | null> {
    try {
      let cakeFaceList = await this.cakeFaceRepository.find({
        order: {
          createDate: 'ASC',
        },
      })
      let newCakeFaceList: CakeFaceEntity[] = []
      cakeFaceList.forEach((cf) => {
        let newCakeFace: CakeFaceEntity = {
          ...cf,
          thumbnail: `${this.configService.get('API_HOST')}/${cf.thumbnail}`,
          configFilePath: `${this.configService.get('API_HOST')}/${cf.configFilePath}`,
        }
        newCakeFaceList.push(newCakeFace)
      })
      return newCakeFaceList
    } catch (error) {
      return null
    }
  }

  async findOne(id: number): Promise<CakeFaceEntity | undefined | null> {
    try {
      return await this.cakeFaceRepository.findOne({ where: { id } })
    } catch (error) {
      return null
    }
  }

  async update(
    cakeFaceId: number,
    updateCakeFaceDto: UpdateCakeFaceDto,
    updater: string,
    thumbnail: Express.Multer.File | undefined,
    configFile: Express.Multer.File | undefined,
  ): Promise<CakeFaceEntity | null> {
    try {
      console.log('DTO_UPDATE_CATEGORY', updateCakeFaceDto)
      console.log('thumbnail', thumbnail)
      console.log('configFile', configFile)

      let newCategory = null
      let { categoryId, ...updateCakeFaceData } = updateCakeFaceDto
      if (categoryId) {
        newCategory = await this.categoryRepository.findOne({ where: { id: Number(categoryId) } })
        if (!newCategory) return null
      }

      let currentCakeFace = await this.cakeFaceRepository.findOne({ where: { id: cakeFaceId } })
      if (!currentCakeFace) {
        return null
      }

      let updateTime = new Date()

      let { id, ...oldData } = currentCakeFace
      console.log('Update cake face with id = ', id)

      let newThumbnailPath = oldData.thumbnail
      if (thumbnail) {
        newThumbnailPath = await this.saveFile(updateTime.getTime(), thumbnail)
        if (!newThumbnailPath) {
          return null
        }
      }

      let newConfigFilePath = oldData.configFilePath
      if (configFile) {
        newConfigFilePath = await this.saveFile(updateTime.getTime(), configFile)
        if (!newConfigFilePath) {
          return null
        }
      }

      let updatedCakeFace = {
        ...oldData,
        ...updateCakeFaceData,
        thumbnail: newThumbnailPath,
        configFilePath: newConfigFilePath,
        updateDate: updateTime,
        updateBy: updater,
        isActive: updateCakeFaceDto.isActive ? updateCakeFaceDto.isActive === '1' : oldData.isActive,
        category: newCategory,
      }
      let updateRes = await this.cakeFaceRepository.update(cakeFaceId, updatedCakeFace)
      if (updateRes.affected > 0) {
        await this.removeOldFile(oldData.thumbnail)
        await this.removeOldFile(oldData.configFilePath)
      }
      return this.cakeFaceRepository.findOne({ where: { id: cakeFaceId } })
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

  private async saveFile(time: string | number, inpFile: Express.Multer.File) {
    let savedAvatarName = `cf_${time}_${generateRandomString(10)}.${inpFile.originalname.split('.').reverse()[0]}`
    let savedThumbnailPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face', savedAvatarName)
    try {
      const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face')
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }
      fs.writeFileSync(savedThumbnailPath, inpFile.buffer)
    } catch (error) {
      console.log('Error when saving file: ', error)
      return null
    }
  }

  private async removeOldFile(path: string) {
    try {
      await fs.promises.unlink(path)
    } catch (error) {
      console.log('ERROR DELETE OLD FILE:', error)
    }
  }
}
