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
import { CAKE_FACE_LIST_RES } from 'src/types/commom'

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
    configFile: Express.Multer.File[],
  ): Promise<CakeFaceEntity | null> {
    try {
      // console.log('CREATE_CAKE_FACE_DTO:', createCakeFaceDto)
      // console.log('thumbnail', thumbnail, typeof thumbnail)
      // console.log('configFile', configFile, typeof configFile)

      let { categoryId, ...createCakeFaceData } = createCakeFaceDto

      let category = await this.categoryRepository.findOne({ where: { id: Number(categoryId) } })
      if (!category) return null

      let createTime = new Date()
      let thumbnailPath = await this.saveFile(createTime.getTime(), thumbnail)
      let configFilePaths: string[] = []
      for (let cf of configFile) {
        let path = await this.saveFile(createTime.getTime(), cf)
        configFilePaths.push(path)
      }
      let configFilePath = configFilePaths.join(',')

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

  async getList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
    categoryId?: number | string,
    isActive?: '1' | '0',
    isTrendy?: '1' | '0',
    sortBy: 'name' | 'createDate' | 'viewAmount' | 'downloadAmount' | 'isTrendy' = 'name',
    sort: 'ASC' | 'DESC' = 'ASC',
  ): Promise<CAKE_FACE_LIST_RES | null> {
    try {
      let queryBuilder = this.cakeFaceRepository
        .createQueryBuilder('cakeFace')
        .leftJoinAndSelect('cakeFace.category', 'category')
        .where('cakeFace.name LIKE :name', { name: `%${name}%` })
        .orderBy(`cakeFace.${sortBy}`, sort)
        .skip((page - 1) * limit)
        .take(limit)

      if (categoryId) {
        queryBuilder.andWhere('cakeFace.category.id = :categoryId', { categoryId: Number(categoryId) })
      }

      if (isActive === '0' || isActive === '1') {
        queryBuilder.andWhere('cakeFace.isActive = :isActive', { isActive: isActive === '1' })
      }

      if (isTrendy === '0' || isTrendy === '1') {
        queryBuilder.andWhere('cakeFace.isTrendy = :isTrendy', { isTrendy: isTrendy === '1' })
      }

      let cakeFaceList = await queryBuilder.getMany()

      let newCakeFaceList: CakeFaceEntity[] = []
      cakeFaceList.forEach((cf) => {
        let newCakeFace: CakeFaceEntity = {
          ...cf,
          thumbnail: `${this.configService.get('API_HOST')}/${cf.thumbnail}`,
          configFilePath: cf.configFilePath
            .split(',')
            .map((x) => `${this.configService.get('API_HOST')}/${x}`)
            .join(','),
        }

        newCakeFaceList.push(newCakeFace)
      })
      const totalActive = await this.cakeFaceRepository.count({ where: { isActive: true } })
      const total = await this.cakeFaceRepository.count()
      return {
        data: newCakeFaceList,
        total,
        totalActive,
      }
    } catch (error) {
      return null
    }
  }

  async findOne(id: number): Promise<CakeFaceEntity | undefined | null> {
    try {
      let cakeFaceData = await this.cakeFaceRepository.findOne({ where: { id }, relations: ['category'] })
      if (!!cakeFaceData) {
        return {
          ...cakeFaceData,
          thumbnail: `${this.configService.get('API_HOST')}/${cakeFaceData.thumbnail}`,
          // configFilePath: `${this.configService.get('API_HOST')}/${cakeFaceData.configFilePath}`,
          configFilePath:
            cakeFaceData.configFilePath.length > 0
              ? cakeFaceData.configFilePath
                  .split(',')
                  .map((x) => `${this.configService.get('API_HOST')}/${x.replaceAll(/\\/g, '/')}`)
                  .join(',')
              : '',
        }
      } else return undefined
    } catch (error) {
      return null
    }
  }

  async update(
    cakeFaceId: number,
    updateCakeFaceDto: UpdateCakeFaceDto,
    updater: string,
    thumbnail?: Express.Multer.File | undefined,
    configFile?: Express.Multer.File | undefined,
  ): Promise<CakeFaceEntity | null> {
    try {
      console.log('DTO_UPDATE_CATEGORY', updateCakeFaceDto)

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
      if (updateRes.affected > 0 && !!configFile && !!thumbnail) {
        await this.removeOldFile(oldData.thumbnail)
        await this.removeOldFile(oldData.configFilePath)
      }
      let cakeFaceData = await this.cakeFaceRepository.findOne({ where: { id: cakeFaceId } })
      if (!!cakeFaceData) {
        return {
          ...cakeFaceData,
          thumbnail: `${this.configService.get('API_HOST')}/${cakeFaceData.thumbnail}`,
          configFilePath: cakeFaceData.configFilePath
            .split(',')
            .map((x) => `${this.configService.get('API_HOST')}/${x.replaceAll(/\\/g, '/')}`)
            .join(','),
        }
      } else return undefined
    } catch (error) {
      console.log('ERROR:', error)
      return null
    }
  }

  async remove(id: string): Promise<number> {
    try {
      console.log('User want to remove category id =', id)
      const result = await this.cakeFaceRepository.delete(id)
      return result.affected
    } catch (error) {
      console.log(error)
      return -1
    }
  }

  async removeConfigFile(id: string, index: string, updater: string): Promise<number> {
    try {
      let currentCakeFace = await this.cakeFaceRepository.findOne({ where: { id: Number(id) } })
      if (!currentCakeFace) return 0
      let pathList = currentCakeFace.configFilePath.split(',')
      if (pathList.length < Number(index)) return 0
      let removedItem = pathList[index]
      pathList.splice(Number(index), 1)
      let updateRes = await this.cakeFaceRepository.update(id, {
        updateBy: updater,
        updateDate: new Date(),
        configFilePath: pathList.join(','),
      })
      if (updateRes.affected > 0) {
        await this.removeOldFile(removedItem)
        return 1
      }
      return 0
    } catch (error) {
      console.log(error)
      return -1
    }
  }

  async addConfigFiles(id: string, newFiles: Express.Multer.File[], updater: string): Promise<number> {
    try {
      let createTime = new Date()
      let currentCakeFace = await this.cakeFaceRepository.findOne({ where: { id: Number(id) } })
      if (!currentCakeFace) return 0
      let pathList = currentCakeFace.configFilePath.split(',')
      for (let cf of newFiles) {
        let path = await this.saveFile(createTime.getTime(), cf)
        pathList.push(path)
      }
      let updateRes = await this.cakeFaceRepository.update(id, {
        updateBy: updater,
        updateDate: new Date(),
        configFilePath: pathList.join(','),
      })
      return updateRes.affected
    } catch (error) {
      console.log(error)
      return -1
    }
  }

  private async saveFile(time: string | number, inpFile: Express.Multer.File) {
    let savedAvatarName = `cf_${inpFile.originalname.split('.')[0]}_${time}_${generateRandomString(10)}.${
      inpFile.originalname.split('.').reverse()[0]
    }`
    let savedFilePath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face', savedAvatarName)
    try {
      const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face')
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }
      fs.writeFileSync(savedFilePath, inpFile.buffer)
      return savedFilePath
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
