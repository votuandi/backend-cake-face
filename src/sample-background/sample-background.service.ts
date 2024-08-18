import { UpdateSampleBackgroundDto } from './dto/update-sample-background.dto';
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { join } from 'path'
import { generateRandomString } from 'src/utils/helpers/common.helpers'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import { SampleBackgroundEntity } from './sample-background.entity'
import { SAMPLE_BACKGROUND_RES } from 'src/types/commom'
import { CreateSampleBackgroundDto } from './dto/create-sample-background.dto'

@Injectable()
export class SampleBackgroundService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SampleBackgroundEntity)
    private readonly sampleBackgroundRepository: Repository<SampleBackgroundEntity>,
  ) {}

  async create(
    createSampleBackgroundDto: CreateSampleBackgroundDto,
    creator: string,
    image: Express.Multer.File | undefined,
  ): Promise<SampleBackgroundEntity | null> {
    try {
      let createTime = new Date()
      let imagePath = await this.saveThumbnail(createTime.getTime(), image)

      let newSampleBackgroundData = {
        ...createSampleBackgroundDto,
        createTime: createTime,
        image: imagePath,
        isActive: createSampleBackgroundDto.isActive === '1',
        createDate: createTime,
        createBy: creator,
        updateDate: createTime,
        updateBy: creator,
      }
      let sampleBackground = this.sampleBackgroundRepository.create(newSampleBackgroundData)
      return await this.sampleBackgroundRepository.save(sampleBackground)
    } catch (error) {
      console.log('------ERROR_CREATE_SAMPLE_BACKGROUND-----')
      console.log('DTO:', createSampleBackgroundDto)
      console.log('By:', creator)
      console.log('Error:', error)

      return null
    }
  }

  async getList(
    limit: number = 99999,
    page: number = 1,
    name: string = '',
    isActive?: '1' | '0',
    sortBy: 'name' | 'createDate' = 'name',
    sort: 'ASC' | 'DESC' = 'ASC',
  ): Promise<SAMPLE_BACKGROUND_RES | null> {
    try {
      let queryBuilder = this.sampleBackgroundRepository
        .createQueryBuilder('sampleBackground')
        .where('sampleBackground.name LIKE :name', { name: `%${name}%` })
        .orderBy(`sampleBackground.isActive`, 'DESC')
        .addOrderBy(`sampleBackground.${sortBy}`, sort)
        .skip((page - 1) * limit)
        .take(limit)

      if (isActive === '0' || isActive === '1') {
        queryBuilder.andWhere('sampleBackground.isActive = :isActive', { isActive: isActive === '1' })
      }

      let categoryList = await queryBuilder.getMany()

      let newDataList: SampleBackgroundEntity[] = []

      categoryList.forEach((cate) => {
        let newCategory: SampleBackgroundEntity = {
          ...cate,
          image: `${this.configService.get('API_HOST')}/${cate.image.replaceAll('\\', '/')}`,
        }
        newDataList.push(newCategory)
      })
      const totalActive = await this.sampleBackgroundRepository.count({ where: { isActive: true } })
      const total = await this.sampleBackgroundRepository.count()
      return {
        data: newDataList,
        total,
        totalActive,
      }
    } catch (error) {
      console.log('------ERROR_GET_SAMPLE_BACKGROUND_LIST-----')
      console.log('Error:', error)

      return null
    }
  }

  async findOne(id: number): Promise<SampleBackgroundEntity | undefined | null> {
    try {
      let sampleBackground = await this.sampleBackgroundRepository.findOne({ where: { id } })
      if (!!sampleBackground) {
        return {
          ...sampleBackground,
          image: `${this.configService.get('API_HOST')}/${sampleBackground.image.replaceAll('\\', '/')}`,
        }
      } else return undefined
    } catch (error) {
      console.log('------ERROR_GET_SAMPLE_BACKGROUND-----')
      console.log('Id:', id)
      console.log('Error:', error)

      return null
    }
  }

  async update(
    sampleBackgroundId: number,
    updateSampleBackgroundDto: UpdateSampleBackgroundDto,
    updater: string,
    image: Express.Multer.File | undefined,
  ): Promise<SampleBackgroundEntity | null> {
    try {
      let currentSampleBackground = await this.sampleBackgroundRepository.findOne({ where: { id: sampleBackgroundId } })
      if (!currentSampleBackground) {
        return null
      }

      let updateTime = new Date()

      let { id, ...oldData } = currentSampleBackground
      console.log('update Category with id = ', id)

      let newImagePath = oldData.image
      if (image) {
        newImagePath = await this.saveThumbnail(updateTime.getTime(), image)
        if (!newImagePath) {
          return null
        }
      }

      let updatedData = {
        ...oldData,
        ...updateSampleBackgroundDto,
        image: newImagePath,
        updateDate: updateTime,
        updateBy: updater,
        isActive: updateSampleBackgroundDto.isActive ? updateSampleBackgroundDto.isActive === '1' : oldData.isActive,
      }
      let updateRes = await this.sampleBackgroundRepository.update(sampleBackgroundId, updatedData)
      if (updateRes.affected > 0 && !!image) {
        await this.removeOldThumbnail(oldData.image)
      }
      return await this.sampleBackgroundRepository.findOne({ where: { id: sampleBackgroundId } })
    } catch (error) {
      console.log('------ERROR_UPDATE_SAMPLE_BACKGROUND-----')
      console.log('Id:', sampleBackgroundId)
      console.log('DTO:', updateSampleBackgroundDto)
      console.log('Image:', image)
      console.log('By:', updater)
      console.log('Error:', error)
      return null
    }
  }

  async remove(id: string): Promise<number> {
    try {
      const currentRecord = await this.sampleBackgroundRepository.findOne({ where: { id: Number(id) } })
      if (currentRecord) {
        await this.removeOldThumbnail(currentRecord.image)
        const result = await this.sampleBackgroundRepository.delete(id)
        return result.affected
      } else return 0
    } catch (error) {
      console.log('------ERROR_DELETE_SAMPLE_BACKGROUND-----')
      console.log('Id:', id)
      console.log('Error:', error)
      return -1
    }
  }

  private async saveThumbnail(time: string | number, thumbnailFile: Express.Multer.File) {
    if (thumbnailFile) {
      let savedAvatarName = `sb_${time}_${generateRandomString(10)}.${
        thumbnailFile.originalname.split('.').reverse()[0]
      }`
      let savedThumbnailPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'sample-background', savedAvatarName)
      console.log('savedThumbnailPath', savedThumbnailPath)

      try {
        const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'sample-background')
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true })
        }
        fs.writeFileSync(savedThumbnailPath, thumbnailFile.buffer)
        return savedThumbnailPath
      } catch (error) {
        console.log('Error when saving image: ', error)
        return null
      }
    } else return null
  }

  private async removeOldThumbnail(path: string) {
    try {
      if (path.includes('default.png')) return
      await fs.promises.unlink(path)
    } catch (error) {
      console.log('ERROR DELETE SAMPLE BACKGROUND:', error)
    }
  }
}
