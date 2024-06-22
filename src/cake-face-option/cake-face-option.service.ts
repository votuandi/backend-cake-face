import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { join } from 'path'
import { generateRandomString } from 'src/utils/helpers/common.helpers'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import { CakeFaceCategoryEntity } from 'src/cake-face-category/cake-face-category.entity'
import { CakeFaceEntity } from 'src/cake-face/cake-face.entity'
import { CakeFaceOptionEntity } from './cake-face-option.entity'
import { CreateCakeFaceOptionDto } from './dto/create-cake-face-option.dto'
import { UpdateCakeFaceOptionDto } from './dto/update-cake-face-option.dto'

@Injectable()
export class CakeFaceOptionService {
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
    createOptionDto: CreateCakeFaceOptionDto,
    creator: string,
    image: Express.Multer.File,
  ): Promise<CakeFaceOptionEntity | null> {
    try {
      console.log('CREATE_OPTION_DTO:', createOptionDto)

      let { cakeFaceId, ...createOptionData } = createOptionDto

      let cakeFace = await this.categoryRepository.findOne({ where: { id: Number(cakeFaceId) } })
      if (!cakeFace) return null

      let createTime = new Date()
      let imagePath = await this.saveImage(createTime.getTime(), image)

      let newOptionData = {
        ...createOptionData,
        createTime: createTime,
        image: imagePath,
        isActive: createOptionData.isActive === '1',
        createDate: createTime,
        createBy: creator,
        updateDate: createTime,
        updateBy: creator,
        cakeFace,
      }

      let newOption = this.optionRepository.create(newOptionData)
      return await this.optionRepository.save(newOption)
    } catch (error) {
      console.log('ERROR_CREATE_CATEGORY:', error)

      return null
    }
  }

  async getList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
    cakeFaceId?: number,
    isActive?: '1' | '0',
    sortBy: 'name' | 'createDate' = 'name',
    sort: 'ASC' | 'DESC' = 'ASC',
  ): Promise<CakeFaceOptionEntity[] | null> {
    try {
      let queryBuilder = this.optionRepository
        .createQueryBuilder('cakeFaceOption')
        .where('cakeFaceOption.name LIKE :name', { name: `%${name}%` })
        .orderBy(`cakeFaceOption.${sortBy}`, sort)
        .skip((page - 1) * limit)
        .take(limit)

      if (cakeFaceId) {
        queryBuilder.andWhere('cakeFaceOption.cakeFace.id = :cakeFaceId', { cakeFaceId })
      }

      if (isActive === '0' || isActive === '1') {
        queryBuilder.andWhere('cakeFaceOption.isActive = :isActive', { isActive: isActive === '1' })
      }

      let optionList = await queryBuilder.getMany()

      let newOptionList: CakeFaceOptionEntity[] = []
      optionList.forEach((opt) => {
        let newOption: CakeFaceOptionEntity = {
          ...opt,
          image: `${this.configService.get('API_HOST')}/${opt.image}`,
        }
        newOptionList.push(newOption)
      })
      return newOptionList
    } catch (error) {
      return null
    }
  }

  async findOne(id: number): Promise<CakeFaceOptionEntity | undefined | null> {
    try {
      return await this.optionRepository.findOne({ where: { id } })
    } catch (error) {
      return null
    }
  }

  async update(
    optionId: number,
    updateOptionDto: UpdateCakeFaceOptionDto,
    updater: string,
    image?: Express.Multer.File | undefined,
  ): Promise<CakeFaceOptionEntity | null> {
    try {
      console.log('DTO_UPDATE_OPTION', UpdateCakeFaceOptionDto)
      console.log('image', image)

      let currentOption = await this.optionRepository.findOne({ where: { id: optionId } })
      if (!currentOption) {
        return null
      }

      let updateTime = new Date()

      let { id, ...oldData } = currentOption
      console.log('Update cake face with id = ', id)

      let newImagePath = oldData.image
      if (image) {
        newImagePath = await this.saveImage(updateTime.getTime(), image)
        if (!newImagePath) {
          return null
        }
      }

      let updatedOptionData = {
        ...oldData,
        ...updateOptionDto,
        image: newImagePath,
        updateDate: updateTime,
        updateBy: updater,
        isActive: updateOptionDto.isActive ? updateOptionDto.isActive === '1' : oldData.isActive,
      }

      let updateRes = await this.optionRepository.update(optionId, updatedOptionData)
      if (updateRes.affected > 0) {
        await this.removeOldImage(oldData.image)
      }
      return this.optionRepository.findOne({ where: { id: optionId } })
    } catch (error) {
      console.log('ERROR:', error)
      return null
    }
  }

  async remove(id: string): Promise<number> {
    try {
      console.log('User want to remove cake face option id =', id)

      return 0
    } catch (error) {
      console.log(error)
      return -1
    }
  }

  private async saveImage(time: string | number, imageFile: Express.Multer.File) {
    let savedAvatarName = `cfo_${time}_${generateRandomString(10)}.${imageFile.originalname.split('.').reverse()[0]}`
    let savedImagePath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face-option', savedAvatarName)
    try {
      const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'cake-face-option')
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }
      fs.writeFileSync(savedImagePath, imageFile.buffer)
    } catch (error) {
      console.log('Error when saving image: ', error)
      return null
    }
  }

  private async removeOldImage(path: string) {
    try {
      await fs.promises.unlink(path)
    } catch (error) {
      console.log('ERROR DELETE OLD IMAGE:', error)
    }
  }
}
