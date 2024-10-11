import { UpdateSamplePatternDto } from './dto/update-sample-pattern.dto'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { join } from 'path'
import { generateRandomString } from 'src/utils/helpers/common.helpers'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import { SamplePatternEntity } from './sample-pattern.entity'
import { SAMPLE_PATTERN_RES } from 'src/types/commom'
import { CreateSamplePatternDto, HtmlToImageDto } from './dto/create-sample-pattern.dto'
import * as puppeteer from 'puppeteer'

@Injectable()
export class SamplePatternService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SamplePatternEntity)
    private readonly samplePatternRepository: Repository<SamplePatternEntity>,
  ) {}

  async create(
    createSamplePatternDto: CreateSamplePatternDto,
    creator: string,
    image: Express.Multer.File | undefined,
  ): Promise<SamplePatternEntity | null> {
    try {
      let createTime = new Date()
      let imagePath = await this.saveThumbnail(createTime.getTime(), image)

      let newSamplePatternData = {
        ...createSamplePatternDto,
        createTime: createTime,
        image: imagePath,
        isActive: createSamplePatternDto.isActive === '1',
        createDate: createTime,
        createBy: creator,
        updateDate: createTime,
        updateBy: creator,
      }
      let samplePattern = this.samplePatternRepository.create(newSamplePatternData)
      return await this.samplePatternRepository.save(samplePattern)
    } catch (error) {
      console.log('------ERROR_CREATE_SAMPLE_PATTERN-----')
      console.log('DTO:', createSamplePatternDto)
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
  ): Promise<SAMPLE_PATTERN_RES | null> {
    try {
      let queryBuilder = this.samplePatternRepository
        .createQueryBuilder('samplePattern')
        .where('samplePattern.name LIKE :name', { name: `%${name}%` })
        .orderBy(`samplePattern.isActive`, 'DESC')
        .addOrderBy(`samplePattern.${sortBy}`, sort)
        .skip((page - 1) * limit)
        .take(limit)

      if (isActive === '0' || isActive === '1') {
        queryBuilder.andWhere('samplePattern.isActive = :isActive', { isActive: isActive === '1' })
      }

      let categoryList = await queryBuilder.getMany()

      let newDataList: SamplePatternEntity[] = []

      categoryList.forEach((cate) => {
        let newCategory: SamplePatternEntity = {
          ...cate,
          image: `${this.configService.get('API_HOST')}/${cate.image.replaceAll('\\', '/')}`,
        }
        newDataList.push(newCategory)
      })
      const totalActive = await this.samplePatternRepository.count({ where: { isActive: true } })
      const total = await this.samplePatternRepository.count()
      return {
        data: newDataList,
        total,
        totalActive,
      }
    } catch (error) {
      console.log('------ERROR_GET_SAMPLE_Pattern_LIST-----')
      console.log('Error:', error)

      return null
    }
  }

  async findOne(id: number): Promise<SamplePatternEntity | undefined | null> {
    try {
      let samplePattern = await this.samplePatternRepository.findOne({ where: { id } })
      if (!!samplePattern) {
        return {
          ...samplePattern,
          image: `${this.configService.get('API_HOST')}/${samplePattern.image.replaceAll('\\', '/')}`,
        }
      } else return undefined
    } catch (error) {
      console.log('------ERROR_GET_SAMPLE_Pattern-----')
      console.log('Id:', id)
      console.log('Error:', error)

      return null
    }
  }

  async update(
    samplePatternId: number,
    updateSamplePatternDto: UpdateSamplePatternDto,
    updater: string,
    image: Express.Multer.File | undefined,
  ): Promise<SamplePatternEntity | null> {
    try {
      let currentSamplePattern = await this.samplePatternRepository.findOne({ where: { id: samplePatternId } })
      if (!currentSamplePattern) {
        return null
      }

      let updateTime = new Date()

      let { id, ...oldData } = currentSamplePattern
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
        ...updateSamplePatternDto,
        image: newImagePath,
        updateDate: updateTime,
        updateBy: updater,
        isActive: updateSamplePatternDto.isActive ? updateSamplePatternDto.isActive === '1' : oldData.isActive,
      }
      let updateRes = await this.samplePatternRepository.update(samplePatternId, updatedData)
      if (updateRes.affected > 0 && !!image) {
        await this.removeOldThumbnail(oldData.image)
      }
      return this.samplePatternRepository.findOne({ where: { id: samplePatternId } })
    } catch (error) {
      console.log('------ERROR_UPDATE_SAMPLE_Pattern-----')
      console.log('Id:', samplePatternId)
      console.log('DTO:', updateSamplePatternDto)
      console.log('Image:', image)
      console.log('By:', updater)
      console.log('Error:', error)
      return null
    }
  }

  async remove(id: string): Promise<number> {
    try {
      const currentRecord = await this.samplePatternRepository.findOne({ where: { id: Number(id) } })
      if (currentRecord) {
        await this.removeOldThumbnail(currentRecord.image)
        const result = await this.samplePatternRepository.delete(id)
        return result.affected
      } else return 0
    } catch (error) {
      console.log('------ERROR_DELETE_SAMPLE_BACKGROUND-----')
      console.log('Id:', id)
      console.log('Error:', error)
      return -1
    }
  }

  async convertHtmlToImage(htmlToImageDto: HtmlToImageDto): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      const page = await browser.newPage()
      await page.setContent(htmlToImageDto.content)
      await page.setViewport({ width: htmlToImageDto.size, height: htmlToImageDto.size })
      const screenshot = await page.screenshot({ type: 'png' })
      await browser.close()
      return Buffer.from(screenshot)
    } catch (error) {
      console.log('ERROR WHEN PARSE HTML TO IMAGE', error)
    }
  }

  private async saveThumbnail(time: string | number, thumbnailFile: Express.Multer.File) {
    if (thumbnailFile) {
      let savedAvatarName = `sp_${time}_${generateRandomString(10)}.${
        thumbnailFile.originalname.split('.').reverse()[0]
      }`
      let savedThumbnailPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'sample-pattern', savedAvatarName)
      console.log('savedThumbnailPath', savedThumbnailPath)

      try {
        const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'sample-pattern')
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
