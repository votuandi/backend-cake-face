import {
  Controller,
  Param,
  Delete,
  Res,
  HttpStatus,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'express'
import { RESPONSE_TYPE } from 'src/types/commom'
import { BannerService } from './banner.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { UpdateBannerDto } from './banner.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/roles.decorator'
import { Role } from 'src/auth/roles.enum'

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(@UploadedFile() image: Express.Multer.File, @Res() res: Response) {
    if (image) {
      let newBanner = await this.bannerService.create(image)
      if (newBanner === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newBanner === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create banner failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Create banner successfully',
          params: newBanner,
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
    let categories = await this.bannerService.findAll()
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
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto, @Res() res: Response) {
    console.log('updateBannerDto', id, updateBannerDto)

    let newBannerList = await this.bannerService.update(id, updateBannerDto)
    if (newBannerList === null) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Internal Server Error',
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    } else if (newBannerList === undefined) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Banner not found',
      }
      res.status(HttpStatus.NOT_FOUND).json(response)
    } else {
      let response: RESPONSE_TYPE = {
        status: true,
        params: newBannerList,
      }
      res.status(HttpStatus.OK).json(response)
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    let success = await this.bannerService.remove(id)
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
