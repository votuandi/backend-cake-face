import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'
import { UserInformationEntity } from './entities/user-information.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import { join } from 'path'
import { USER_LIST_RES } from 'src/types/commom'

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
    try {
      const userInformation = await this.userInformationRepository.findOne({ where: { userName } })
      if (!userInformation) {
        return undefined
      }
      return userInformation
    } catch (error) {
      return null
    }
  }

  async getUserList(
    limit: number = 10,
    page: number = 1,
    keyword: string = '',
    isActive?: '1' | '0',
    role?: 'admin' | 'client' | 'user',
  ): Promise<USER_LIST_RES | null> {
    // return this.userInformationRepository.find()
    try {
      let queryBuilder = this.userInformationRepository.createQueryBuilder('userInformation')

      if (role === 'admin' || role === 'client' || role === 'user') {
        queryBuilder.where('userInformation.role = :role', { role })
      }

      queryBuilder
        .andWhere(
          new Brackets((qb) => {
            if (keyword) {
              qb.where('userInformation.userName LIKE :keyword', { keyword: `%${keyword}%` })
                .orWhere('userInformation.name LIKE :keyword', { keyword: `%${keyword}%` })
                .orWhere('userInformation.phoneNumber LIKE :keyword', { keyword: `%${keyword}%` })
            }
          }),
        )
        .orderBy('userInformation.userName', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)

      if (isActive === '0' || isActive === '1') {
        queryBuilder.andWhere('userInformation.isActive = :isActive', { isActive: isActive === '1' })
      }

      let userInformationList = await queryBuilder.getMany()
      let newUserInformationList: UserInformationEntity[] = []
      userInformationList.forEach((u) => {
        let newUserInformation: UserInformationEntity = {
          ...u,
          avatar: `${this.configService.get('API_HOST')}/${u.avatar.replaceAll(/\\/g, '/')}`,
        }
        newUserInformationList.push(newUserInformation)
      })
      const totalActive = await this.userInformationRepository.count({ where: { isActive: true } })
      const total = await this.userInformationRepository.count()
      return {
        data: newUserInformationList,
        total,
        totalActive,
      }
    } catch (error) {
      console.log(error)
      return null
    }
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
