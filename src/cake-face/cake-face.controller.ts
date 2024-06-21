import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Request,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common'
import { CakeFaceService } from './cake-face.service'
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { RESPONSE_TYPE } from 'src/types/commom'
import { CreateCakeFaceDto } from './dto/create-cake-face.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/roles.decorator'
import { Role } from 'src/auth/roles.enum'
import { UpdateCakeFaceDto } from './dto/update-cake-face.dto'

@Controller('cake-face')
export class CakeFaceController {
  constructor(private readonly cakeFaceService: CakeFaceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @UseInterceptors(FileInterceptor('configFile'))
  async create(
    @UploadedFile() thumbnail: Express.Multer.File,
    @UploadedFile() configFile: Express.Multer.File,
    @Body() createCakeFaceDto: CreateCakeFaceDto,
    @Request() req,
    @Res() res: Response,
  ) {
    let requester = req?.user?.userName
    if (!requester) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Permission deny',
      }
      res.status(HttpStatus.FORBIDDEN).json(response)
    }

    if (!!thumbnail && !!configFile) {
      let newCategory = await this.cakeFaceService.create(createCakeFaceDto, requester, thumbnail, configFile)
      if (newCategory === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newCategory === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create Cake face failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Create Cake face successfully',
          params: newCategory,
        }
        res.status(HttpStatus.CREATED).json(response)
      }
    } else {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Image not found',
      }
      res.status(HttpStatus.NOT_FOUND).json(response)
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      let categories = await this.cakeFaceService.findAll()
      if (Array.isArray(categories)) {
        let response: RESPONSE_TYPE = {
          status: true,
          params: categories,
        }
        res.status(HttpStatus.OK).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
          params: [],
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Bad Request',
        params: [],
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      let category = await this.cakeFaceService.findOne(Number(id))
      if (category === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (category === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Category not found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          params: category,
        }
        res.status(HttpStatus.OK).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Bad Request',
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @UseInterceptors(FileInterceptor('configFile'))
  async update(
    @Param('id') id: string,
    @UploadedFile() thumbnail: Express.Multer.File,
    @UploadedFile() configFile: Express.Multer.File,
    @Body() updateCakeFaceDto: UpdateCakeFaceDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission Deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      let cakeFace = await this.cakeFaceService.update(Number(id), updateCakeFaceDto, requester, thumbnail, configFile)
      if (cakeFace === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (cakeFace === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Cake Face Not Found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          params: cakeFace,
        }
        res.status(HttpStatus.OK).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Bad Request',
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    let success = await this.cakeFaceService.remove(id)
    if (success === 1) {
      let response: RESPONSE_TYPE = {
        status: true,
        message: `Deleted ${id}`,
      }
      res.status(HttpStatus.OK).json(response)
    } else if (success === 0) {
      let response: RESPONSE_TYPE = {
        status: true,
        message: 'Category not found',
      }
      res.status(HttpStatus.NOT_FOUND).json(response)
    } else {
      let response: RESPONSE_TYPE = {
        status: true,
        message: 'Internal Server Error',
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    }
  }
}
