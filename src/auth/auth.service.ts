import { LoginPayloadDto } from './dto/auth.dto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
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
    const accessToken = this.jwtService.sign({ userName: user.userName })
    const refreshToken = this.jwtService.sign(
      { userName: user.userName },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME,
        secret: process.env.JWT_REFRESH_SECRET,
      },
    )
    return { user, accessToken, refreshToken }
  }

  private async validateUser(loginPayloadDto: LoginPayloadDto): Promise<UserEntity | null> {
    // Find user by userName
    const user = await this.userRepository.findOne({ where: { userName: loginPayloadDto.userName } })
    const userHashPassword = await this.hashPassword(user.password)
    if (user && userHashPassword && bcrypt.compareSync(loginPayloadDto.password, userHashPassword)) {
      // Fetch user information
      const userInfo = await this.userInformationRepository.findOne({ where: { userName: loginPayloadDto.userName } })
      if (userInfo) {
        user.userInformation = userInfo
      }
      return user
    }
    return null
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS')
    return await bcrypt.hash(password, saltRounds)
  }
}
