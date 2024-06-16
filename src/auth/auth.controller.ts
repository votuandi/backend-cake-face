import { Controller, Post, Body, Get } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginPayloadDto } from './dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginPayloadDto: LoginPayloadDto) {
    return await this.authService.login(loginPayloadDto)
  }

  @Get('test')
  test() {
    return 'hello world'
  }
}
