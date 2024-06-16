import { UserEntity } from './../../users/entities/user.entity'
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Request } from 'express' // Import Request type if not already imported
import { Role } from '../roles.enum'

// Define a custom interface for extending Request object
interface AuthenticatedRequest extends Request {
  user?: any // You can define a specific interface for user if needed
}

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    try {
      const accessToken = this.extractAccessToken(request.headers.authorization)

      // Verify and decode the access token
      const decoded = this.jwtService.verify(accessToken) as { userName: string; role: Role }

      // Fetch user details from the database using userRepository
      const user = await this.userRepository.findOne({ where: { userName: decoded.userName } })
      console.log('user_interceptor_1', user)

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      // Attach user information to the request
      console.log('user_interceptor', user)

      request.user = user

      return next.handle()
    } catch (error) {
      throw new UnauthorizedException('Unauthorized')
    }
  }

  private extractAccessToken(authorizationHeader: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Unauthorized')
    }

    const parts = authorizationHeader.split(' ')

    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Unauthorized')
    }

    const token = parts[1]
    return token
  }
}
