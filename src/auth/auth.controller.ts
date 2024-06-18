import { Controller, Post, Body, Get, Res, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginPayloadDto, RefreshTokenDto } from './dto/auth.dto'
import { Response } from 'express'
import { RESPONSE_TYPE } from 'src/types/commom'
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginPayloadDto: LoginPayloadDto, @Res() res: Response) {
    let user = await this.authService.login(loginPayloadDto)
    if (user) {
      let response: RESPONSE_TYPE = {
        status: true,
        message: 'Sign in successfully',
        params: user,
      }
      res.status(HttpStatus.OK).json(response)
      return response
    } else {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Sign in failed',
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
    }
  }

  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return await this.authService.refresh(refreshDto.refreshToken)
  }

  @Get('test')
  test() {
    return 'hello world'
  }
}
