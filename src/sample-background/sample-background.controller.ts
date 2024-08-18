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
import { RESPONSE_TYPE, SAMPLE_BACKGROUND_RES } from 'src/types/commom'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/roles.decorator'
import { Role } from 'src/auth/roles.enum'
import { SampleBackgroundService } from './sample-background.service'
import { CreateSampleBackgroundDto } from './dto/create-sample-background.dto'
import { UpdateSampleBackgroundDto } from './dto/update-sample-background.dto'

@Controller('sample-background')
export class SampleBackgroundController {
  constructor(private readonly sampleBackgroundService: SampleBackgroundService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() createSampleBackgroundDto: CreateSampleBackgroundDto,
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

      let newSampleBackground = await this.sampleBackgroundService.create(createSampleBackgroundDto, requester, image)
      if (newSampleBackground === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newSampleBackground === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create Sample Background failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Create Sample Background successfully',
          params: newSampleBackground,
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
  
      let sampleBackgroundList: SAMPLE_BACKGROUND_RES = await this.sampleBackgroundService.getList(
        limit,
        page,
        name,
        isActive,
        sortBy,
        sort,
      )
      if (Array.isArray(sampleBackgroundList.data)) {
        let response: RESPONSE_TYPE = {
          status: true,
          params: { ...sampleBackgroundList, limit: limit },
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
      let sampleBackground = await this.sampleBackgroundService.findOne(Number(id))
      if (sampleBackground === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (sampleBackground === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Sample Background not found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          params: sampleBackground,
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
    @Body() updateSampleBackgroundDto: UpdateSampleBackgroundDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      console.log('UPDATE_SB');
      
      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      let sampleBackground = await this.sampleBackgroundService.update(Number(id), updateSampleBackgroundDto, requester, image)

      if (sampleBackground === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.BAD_REQUEST).json(response)
      } else if (sampleBackground === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Sample Background Not Found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          params: sampleBackground,
        }
        res.status(HttpStatus.OK).json(response)
      }
    } catch (error) {
      console.log('error', error)
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
      let success = await this.sampleBackgroundService.remove(id)
      if (success === 1) {
        let response: RESPONSE_TYPE = {
          status: true,
          message: `Deleted ${id}`,
        }
        res.status(HttpStatus.OK).json(response)
      } else if (success === 0) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Sample Background Not Found',
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
