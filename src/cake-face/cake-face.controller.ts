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
  UseGuards,
  Query,
  UploadedFiles,
} from '@nestjs/common'
import { CakeFaceService } from './cake-face.service'
import { Response } from 'express'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { CAKE_FACE_LIST_RES, RESPONSE_TYPE } from 'src/types/commom'
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'configFile', maxCount: 10 },
    ]),
  )
  async create(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[]
      configFile?: Express.Multer.File[]
    },
    @Body() createCakeFaceDto: CreateCakeFaceDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      console.log('CREATE CF')

      let thumbnail = files.thumbnail[0]
      let configFile = files.configFile

      console.log(files)

      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      if (!!thumbnail && configFile.length > 0) {
        let newCakeFace = await this.cakeFaceService.create(createCakeFaceDto, requester, thumbnail, configFile)
        if (newCakeFace === null) {
          let response: RESPONSE_TYPE = {
            status: false,
            message: 'Internal Server Error',
          }
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
        } else if (newCakeFace === undefined) {
          let response: RESPONSE_TYPE = {
            status: false,
            message: 'Create Cake face failed',
          }
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
        } else {
          let response: RESPONSE_TYPE = {
            status: true,
            message: 'Create Cake face successfully',
            params: newCakeFace,
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
    } catch (error) {
      console.log(error)
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Bad Request',
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
    }
  }

  @Get()
  async getList(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('name') name: string,
    @Query('categoryId') categoryId: number | string,
    @Query('isActive') isActive: '0' | '1',
    @Query('isTrendy') isTrendy: '0' | '1',
    @Query('sortBy') sortBy: 'name' | 'createDate' | 'viewAmount' | 'downloadAmount' | 'isTrendy',
    @Query('sort') sort: 'ASC' | 'DESC',
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      // Validate and set defaults
      limit = isNaN(limit) || limit <= 0 ? 99999 : limit
      page = isNaN(page) || page <= 0 ? 1 : page
      name = name || ''
      sortBy =
        sortBy !== 'name' &&
        sortBy !== 'createDate' &&
        sortBy !== 'viewAmount' &&
        sortBy !== 'downloadAmount' &&
        sortBy !== 'isTrendy'
          ? 'name'
          : sortBy
      sort = ['isTrendy', 'viewAmount', 'downloadAmount'].includes(sortBy)
        ? 'DESC'
        : sort !== 'ASC' && sort !== 'DESC'
          ? 'ASC'
          : sort
      categoryId = categoryId === '' ? undefined : categoryId

      let cakeFaceListRes: CAKE_FACE_LIST_RES = await this.cakeFaceService.getList(
        limit,
        page,
        name,
        categoryId,
        isActive,
        isTrendy,
        sortBy,
        sort,
      )
      if (Array.isArray(cakeFaceListRes.data)) {
        let response: RESPONSE_TYPE = {
          status: true,
          params: { ...cakeFaceListRes, limit: limit },
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'configFile', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: { thumbnail?: Express.Multer.File[]; configFile?: Express.Multer.File[] },
    @Body() updateCakeFaceDto: UpdateCakeFaceDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      let thumbnail = undefined
      let configFile = undefined
      if (!!files) {
        thumbnail = Array.isArray(files.thumbnail) ? files.thumbnail[0] : undefined
        configFile = Array.isArray(files.configFile) ? files.configFile[0] : undefined
      }

      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission Deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      console.log('requester', requester)

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

  @Put(':id/rise-view')
  async riseView(@Param('id') id: string, @Res() res: Response) {
    try {
      let result = await this.cakeFaceService.riseView(Number(id))
      if (result) {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'True',
        }
        res.status(HttpStatus.NO_CONTENT).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'False',
        }
        res.status(HttpStatus.NO_CONTENT).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Bad Request',
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
    }
  }

  @Put(':id/rise-download')
  async riseDownload(@Param('id') id: string, @Res() res: Response) {
    try {
      let result = await this.cakeFaceService.riseDownload(Number(id))
      if (result) {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'True',
        }
        res.status(HttpStatus.NO_CONTENT).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'False',
        }
        res.status(HttpStatus.NO_CONTENT).json(response)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/config/:index')
  async removeConfigFile(@Param('id') id: string, @Param('index') index: string, @Request() req, @Res() res: Response) {
    let requester = req?.user?.userName
    if (!requester) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Permission Deny',
      }
      res.status(HttpStatus.FORBIDDEN).json(response)
    }
    let success = await this.cakeFaceService.removeConfigFile(id, index, requester)
    if (success === 1) {
      let response: RESPONSE_TYPE = {
        status: true,
        message: `Successfully`,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id/config')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'configFile', maxCount: 10 }]))
  async addConfigFiles(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      configFile?: Express.Multer.File[]
    },
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      let configFile = files.configFile
      if (configFile.length < 1) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Bad Request',
        }
        res.status(HttpStatus.BAD_REQUEST).json(response)
      }

      let requester = req?.user?.userName
      if (!requester) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Permission deny',
        }
        res.status(HttpStatus.FORBIDDEN).json(response)
      }

      let result = await this.cakeFaceService.addConfigFiles(id, configFile, requester)
      if (result > 0) {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Successfully',
        }
        res.status(HttpStatus.NO_CONTENT).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'INTERNAL_SERVER_ERROR',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      }
    } catch (error) {
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'INTERNAL_SERVER_ERROR',
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
    }
  }
}
