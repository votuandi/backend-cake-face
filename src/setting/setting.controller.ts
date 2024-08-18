import {
  Controller,
  Res,
  HttpStatus,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common'
import { Response } from 'express'
import { RESPONSE_TYPE } from 'src/types/commom'
import { SettingService } from './setting.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/roles.decorator'
import { Role } from 'src/auth/roles.enum'
import { UpdateLogoDto, UpdateSeoContentDto } from './setting.dto'

@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('logo')
  @UseInterceptors(FileInterceptor('image'))
  async updateLogo(
    @UploadedFile() image: Express.Multer.File,
    @Body() updateLogoDto: UpdateLogoDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      if (image) {
        let requester = req?.user?.userName
        if (!requester) {
          let response: RESPONSE_TYPE = {
            status: false,
            message: 'Permission deny',
          }
          res.status(HttpStatus.FORBIDDEN).json(response)
        }

        let newLogo = await this.settingService.updateLogo(image, updateLogoDto.name, requester)
        if (newLogo === null) {
          let response: RESPONSE_TYPE = {
            status: false,
            message: 'Internal Server Error',
          }
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
        } else if (newLogo === undefined) {
          let response: RESPONSE_TYPE = {
            status: false,
            message: 'Update Logo failed',
          }
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
        } else {
          let response: RESPONSE_TYPE = {
            status: true,
            message: 'Update Logo successfully',
            params: newLogo,
          }
          res.status(HttpStatus.CREATED).json(response)
        }
      } else {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Image not found',
        }
        res.status(HttpStatus.BAD_REQUEST).json(response)
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
  @Post('seo-content')
  async updateSeoContent(@Body() updateSeoContentDto: UpdateSeoContentDto, @Request() req, @Res() res: Response) {
    try {
      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      let newContent = await this.settingService.updateSeoContent(updateSeoContentDto['value'], requester)
      if (newContent === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newContent === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Update Logo failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Update Logo successfully',
          params: newContent,
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

  @Get()
  async findAll(@Res() res: Response) {
    let settings = await this.settingService.findAll()
    if (Array.isArray(settings)) {
      let response: RESPONSE_TYPE = {
        status: true,
        params: settings,
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
}
