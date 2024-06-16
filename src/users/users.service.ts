import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'
import { UserInformationEntity } from './entities/user-information.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import { join } from 'path'

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInformationEntity)
    private readonly userInformationRepository: Repository<UserInformationEntity>,
  ) {}

  async createAccount(
    createUserDto: CreateUserDto,
    avatarFile: Express.Multer.File,
    creator: string,
  ): Promise<UserInformationEntity> {
    try {
      const { userName, password, ...userInfo } = createUserDto
      const existedUser = await this.userRepository.findOne({ where: { userName: userName } })
      if (existedUser) return undefined

      // Create new user
      const hashedPassword = await this.hashPassword(password)
      const newUser = this.userRepository.create({ userName, password: hashedPassword })

      console.log('newUser', newUser)

      // Save user to the database
      await this.userRepository.save(newUser)

      // Save avatar
      let avatarPath = await this.saveAvatar(userName, avatarFile)

      // Create user information
      let newUserInformationData = {
        ...userInfo,
        userName,
        isActive: createUserDto.isActive === '1',
        createDate: new Date(),
        createBy: creator,
        updateDate: new Date(),
        updateBy: creator,
        avatar: avatarPath,
      }
      console.log('newUserInformationData', newUserInformationData)

      const newUserInformation = this.userInformationRepository.create(newUserInformationData)

      // Save user information to the database
      await this.userInformationRepository.save(newUserInformation)

      return newUserInformation
    } catch (error) {
      console.log(error)
      return null
    }
  }

  async updateUserInformation(userName: string, updateUserDto: UpdateUserDto): Promise<UserInformationEntity> {
    const userInformation = await this.userInformationRepository.findOne({ where: { userName } })

    if (!userInformation) {
      throw new NotFoundException(`User with userName ${userName} not found`)
    }

    Object.assign(userInformation, updateUserDto, { updateDate: new Date() })
    return this.userInformationRepository.save(userInformation)
  }

  async getUserInformation(userName: string): Promise<UserInformationEntity> {
    const userInformation = await this.userInformationRepository.findOne({ where: { userName } })

    if (!userInformation) {
      throw new NotFoundException(`User with userName ${userName} not found`)
    }

    return userInformation
  }

  async getUserList(): Promise<UserInformationEntity[]> {
    return this.userInformationRepository.find()
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS')

    return await bcrypt.hash(password, Number(saltRounds))
  }

  private async saveAvatar(userName: string, avatarFile: Express.Multer.File) {
    if (avatarFile) {
      let savedAvatarName = `avatar_${userName}_${new Date().getTime()}.${
        avatarFile.originalname.split('.').reverse()[0]
      }`
      let savedThumbnailPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'avatar', savedAvatarName)
      try {
        const folderPath = join(this.configService.get('MEDIA_UPLOAD_PATH'), 'avatar')
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true })
        }
        fs.writeFileSync(savedThumbnailPath, avatarFile.buffer)
      } catch (error) {
        console.log('Error when saving image: ', error)
        return null
      }
    } else return join(this.configService.get('MEDIA_UPLOAD_PATH'), 'avatar', 'default.webp')
  }
}
