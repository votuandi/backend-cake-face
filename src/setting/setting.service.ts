import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SettingEntity } from './setting.entity'
import { join } from 'path'
import * as fs from 'fs'
import { LOGO_TYPE } from 'src/types/commom'
import pngToIco from 'png-to-ico'

@Injectable()
export class SettingService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SettingEntity)
    private readonly settingRepository: Repository<SettingEntity>,
  ) {}

  async updateLogo(image: Express.Multer.File, type: LOGO_TYPE, updater: string): Promise<SettingEntity | null> {
    try {
      if (!image) return

      const createTime = new Date()
      const newImagePath = await this.saveFile(type, image, createTime.getTime())
      if (!newImagePath) return null

      const logoName = `${type}_logo`
      const currentLogo = await this.settingRepository.findOne({
        where: { name: logoName },
      })

      let updatedData: Partial<SettingEntity> = {
        name: logoName,
        value: newImagePath,
        updateDate: createTime,
        updateBy: updater,
      }

      if (currentLogo) {
        // Existed => Update
        const updateRes = await this.settingRepository.update(currentLogo.id, updatedData)
        if (updateRes.affected > 0 && !!image) {
          await this.removeOldFile(currentLogo.value)
        }
      } else {
        // Create new
        let newLogo = this.settingRepository.create(updatedData)
        await this.settingRepository.save(newLogo)
      }

      if (type === `small`) {
        const currentIco = await this.settingRepository.findOne({
          where: { name: `ico_logo` },
        })

        let updatedIcoData: Partial<SettingEntity> = {
          name: `ico_logo`,
          value: `${newImagePath.split('.').slice(0, -1).join('.')}.ico`,
          updateDate: createTime,
          updateBy: updater,
        }

        if (currentIco) {
          // Existed => Update
          const updateIconRes = await this.settingRepository.update(currentIco.id, updatedIcoData)
          if (updateIconRes.affected > 0 && !!image) {
            await this.removeOldFile(currentIco.value)
          }
        } else {
          // Create new
          let newIco = this.settingRepository.create(updatedIcoData)
          await this.settingRepository.save(newIco)
        }
      }

      const result = await this.settingRepository.findOne({ where: { name: logoName } })
      return {
        ...result,
        value: `${this.configService.get('API_HOST')}/${result.value.replaceAll('\\', '/')}`,
      }
    } catch (error) {
      console.log('ERROR_CREATE_BANNER:', error)
      return null
    }
  }

  async updateSeoContent(content: string, updater: string): Promise<SettingEntity | null> {
    try {
      const createTime = new Date()

      const currentContent = await this.settingRepository.findOne({
        where: { name: 'seo_content' },
      })

      let updatedData: Partial<SettingEntity> = {
        name: 'seo_content',
        value: content,
        updateDate: createTime,
        updateBy: updater,
      }

      if (currentContent) {
        // Existed => Update
        await this.settingRepository.update(currentContent.id, updatedData)
      } else {
        // Create new
        let newRecord = this.settingRepository.create(updatedData)
        await this.settingRepository.save(newRecord)
      }

      return await this.settingRepository.findOne({ where: { name: 'seo_content' } })
    } catch (error) {
      console.log('ERROR_CREATE_BANNER:', error)
      return null
    }
  }

  async findAll(): Promise<SettingEntity[] | null> {
    try {
      let settingList = await this.settingRepository.find()
      let newSettingList: SettingEntity[] = settingList.map((s) => {
        if (s.name === 'seo_content') return s
        else
          return {
            ...s,
            value: `${this.configService.get('API_HOST')}/${s.value.replaceAll('\\', '/')}`,
          }
      })
      return newSettingList
    } catch (error) {
      return null
    }
  }

  private async saveFile(type: LOGO_TYPE, inpFile: Express.Multer.File, time: string | number) {
    let savedLogoName = `logo_${type}_${time}.${inpFile.originalname.split('.').reverse()[0]}`
    let savedFilePath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'logo', savedLogoName)
    try {
      const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'logo')
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }
      fs.writeFileSync(savedFilePath, inpFile.buffer)

      if (type === 'small') {
        let savedIcoName = `logo_${type}_${time}.ico`
        let savedIcoPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'logo', savedIcoName)
        const icoBuffer = await pngToIco(savedFilePath)
        fs.writeFileSync(savedIcoPath, icoBuffer)
      }
      return savedFilePath
    } catch (error) {
      console.log('Error when saving file: ', error)
      return null
    }
  }

  private async removeOldFile(path: string) {
    try {
      if (path.includes('default.png')) return
      await fs.promises.unlink(path)
    } catch (error) {
      console.log('ERROR DELETE OLD LOGO:', error)
    }
  }
}
