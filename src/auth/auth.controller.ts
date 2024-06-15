import { Controller, Post, Body } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginPayloadDto } from './dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginPayloadDto: LoginPayloadDto) {
    return this.authService.login(loginPayloadDto)
  }
}
