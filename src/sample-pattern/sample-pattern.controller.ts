import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common'
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { RESPONSE_TYPE, SAMPLE_PATTERN_RES } from 'src/types/commom'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/roles.decorator'
import { Role } from 'src/auth/roles.enum'
import { SamplePatternService } from './sample-pattern.service'
import { CreateSamplePatternDto, HtmlToImageDto } from './dto/create-sample-pattern.dto'
import { UpdateSamplePatternDto } from './dto/update-sample-pattern.dto'

@Controller('sample-pattern')
export class SamplePatternController {
  constructor(private readonly samplePatternService: SamplePatternService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() createSamplePatternDto: CreateSamplePatternDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      let newSamplePattern = await this.samplePatternService.create(createSamplePatternDto, requester, image)
      if (newSamplePattern === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newSamplePattern === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create Sample Pattern failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Create Sample Pattern successfully',
          params: newSamplePattern,
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

  @Post('download-sample')
  async htmlToImage(@Body() htmlToImageDto: HtmlToImageDto, @Res() res: Response) {
    try {
      console.log(htmlToImageDto)

      const image = await this.samplePatternService.convertHtmlToImage(htmlToImageDto)
      res.setHeader('Content-Type', 'image/png')
      if (image === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (image === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create Sample Pattern failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        // let response: RESPONSE_TYPE = {
        //   status: false,
        //   message: 'Create Sample Pattern failed',
        //   params: image
        // }
        res.status(HttpStatus.OK).send(image)
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
  async getList(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('name') name: string,
    @Query('isActive') isActive: '0' | '1',
    @Query('sortBy') sortBy: 'name' | 'createDate',
    @Query('sort') sort: 'ASC' | 'DESC',
    @Res() res: Response,
  ) {
    try {
      // Validate and set defaults
      limit = isNaN(limit) || limit <= 0 ? 99999 : limit
      page = isNaN(page) || page <= 0 ? 1 : page
      name = name || ''
      sortBy = sortBy !== 'name' && sortBy !== 'createDate' ? 'name' : sortBy
      sort = sort !== 'ASC' && sort !== 'DESC' ? 'ASC' : sort

      let samplePatternList: SAMPLE_PATTERN_RES = await this.samplePatternService.getList(
        limit,
        page,
        name,
        isActive,
        sortBy,
        sort,
      )
      if (Array.isArray(samplePatternList.data)) {
        let response: RESPONSE_TYPE = {
          status: true,
          params: { ...samplePatternList, limit: limit },
        }
        res.status(HttpStatus.OK).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Internal Server Error',
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      let samplePattern = await this.samplePatternService.findOne(Number(id))
      if (samplePattern === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (samplePattern === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Sample Pattern not found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          params: samplePattern,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() updateSamplePatternDto: UpdateSamplePatternDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      console.log('UPDATE SP')

      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      let samplePattern = await this.samplePatternService.update(Number(id), updateSamplePatternDto, requester, image)

      if (samplePattern === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (samplePattern === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Sample Pattern Not Found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          params: samplePattern,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      let success = await this.samplePatternService.remove(id)
      if (success === 1) {
        let response: RESPONSE_TYPE = {
          status: true,
          message: `Deleted ${id}`,
        }
        res.status(HttpStatus.OK).json(response)
      } else if (success === 0) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Sample Pattern Not Found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: true,
        message: 'Internal Server Error',
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    }
  }
}
