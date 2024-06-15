import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  Request,
} from '@nestjs/common'
import { UserService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { Role } from '../auth/roles.enum'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { RESPONSE_TYPE } from 'src/types/commom'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  async createAccount(
    @UploadedFile() avatar: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      console.log('createUserDto', createUserDto)
      // console.log('avatar', avatar)

      let requester = req?.user?.userName ?? 'Developer'

      console.log(requester)

      let newUser = await this.userService.createAccount(createUserDto, avatar, requester)
      if (newUser === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newUser === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create new user failed',
        }
        res.status(HttpStatus.BAD_REQUEST).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Create user successfully',
          params: newUser,
        }
        res.status(HttpStatus.CREATED).json(response)
      }
    } catch (error) {
      console.log(error)
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Internal Server Error',
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':userName')
  async updateUserInformation(@Param('userName') userName: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserInformation(userName, updateUserDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userName')
  async getUserInformation(@Param('userName') userName: string) {
    return this.userService.getUserInformation(userName)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getUserList() {
    return this.userService.getUserList()
  }
}
