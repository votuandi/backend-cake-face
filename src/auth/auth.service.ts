import { LoginPayloadDto } from './dto/auth.dto'
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { UserEntity } from '../users/entities/user.entity'
import { UserInformationEntity } from '../users/entities/user-information.entity'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInformationEntity)
    private readonly userInformationRepository: Repository<UserInformationEntity>,
  ) {}

  async login(loginPayloadDto: LoginPayloadDto) {
    // Validate user credentials
    const user = await this.validateUser(loginPayloadDto)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    // Generate tokens
    const tokenPayload = { userName: user.userName, role: user.role }
    const accessToken = this.jwtService.sign(tokenPayload)
    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
    })
    return { user, accessToken, refreshToken }
  }

  async validateUser(loginPayloadDto: LoginPayloadDto): Promise<UserInformationEntity | null> {
    // Find user by userName
    const user = await this.userRepository.findOne({ where: { userName: loginPayloadDto.userName } })

    if (user && bcrypt.compareSync(loginPayloadDto.password, user.password)) {
      // Fetch user information'

      const userInfo = await this.userInformationRepository.findOne({ where: { userName: loginPayloadDto.userName } })

      if (userInfo) {
        user.userInformation = userInfo
      }

      return userInfo
    }
    return null
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      })

      const user = await this.findUser(payload.userName)
      if (!user) {
        throw new ForbiddenException('User not found')
      }

      const tokenPayload = { userName: user.userName, role: user.role }
      return {
        accessToken: this.jwtService.sign(tokenPayload),
        refreshToken: this.jwtService.sign(tokenPayload, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
        }),
      }
    } catch (e) {
      throw new ForbiddenException('Invalid refresh token')
    }
  }

  async findUser(userName: string): Promise<UserInformationEntity | null> {
    try {
      const user = await this.userRepository.findOne({ where: { userName } })
      const userInfo = await this.userInformationRepository.findOne({ where: { userName } })
      if (!user || !userInfo) {
        return null
      }

      return userInfo
    } catch (error) {
      console.log(error)
      return null
    }
  }
}
