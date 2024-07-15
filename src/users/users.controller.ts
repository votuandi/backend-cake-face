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
  Query,
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
import { RESPONSE_TYPE, USER_LIST_RES } from 'src/types/commom'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  async createAccount(
    @UploadedFile() avatar: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      let requester = req?.user?.userName ?? 'Developer'

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('/get-info/:userName')
  async getUserInformation(@Param('userName') userName: string) {
    console.log('userName', userName)

    return this.userService.getUserInformation(userName)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getUserList(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('keyword') keyword: string,
    @Query('isActive') isActive: '0' | '1',
    @Query('role') role: 'admin' | 'client' | 'user',
    @Res() res: Response,
  ) {
    try {
      limit = isNaN(limit) || limit <= 0 ? 99999 : limit
      page = isNaN(page) || page <= 0 ? 1 : page
      keyword = keyword || ''

      let records: USER_LIST_RES = await this.userService.getUserList(limit, page, keyword, isActive, role)
      if (Array.isArray(records?.data)) {
        let response: RESPONSE_TYPE = {
          status: true,
          params: { ...records, limit: limit },
        }
        res.status(HttpStatus.OK).json(response)
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

  @UseGuards(JwtAuthGuard)
  @Get('get-info')
  async getUserInfo(@Request() req, @Res() res: Response) {
    try {
      let userInfo = await this.userService.getUserInformation(req.user.userName)
      console.log('userInfo', userInfo)

      if (userInfo === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (userInfo === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'User not found',
        }
        res.status(HttpStatus.BAD_REQUEST).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: "Get user's information successfully",
          params: userInfo,
        }
        res.status(HttpStatus.OK).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Internal Server Error',
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    }
  }
}
