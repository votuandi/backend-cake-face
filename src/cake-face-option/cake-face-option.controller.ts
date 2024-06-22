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
  Query,
} from '@nestjs/common'
import { CakeFaceOptionService } from './cake-face-option.service'
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { RESPONSE_TYPE } from 'src/types/commom'
import { CreateCakeFaceOptionDto } from './dto/create-cake-face-option.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Role } from 'src/auth/roles.enum'
import { Roles } from 'src/auth/roles.decorator'
import { UpdateCakeFaceOptionDto } from './dto/update-cake-face-option.dto'

@Controller('cake-face-option')
export class CakeFaceOptionController {
  constructor(private readonly categoryService: CakeFaceOptionService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body() createCategoryDto: CreateCakeFaceOptionDto,
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

    if (image) {
      let newCategory = await this.categoryService.create(createCategoryDto, requester, image)
      if (newCategory === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newCategory === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create Cake Face Option Failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Create Cake Face Option Successfully',
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
  async getAll(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('name') name: string,
    @Query('cakeFaceId') cakeFaceId: number,
    @Query('isActive') isActive: '0' | '1',
    @Query('sortBy') sortBy: 'name' | 'createDate' | 'viewAmount' | 'downloadAmount',
    @Query('sort') sort: 'ASC' | 'DESC',
    @Res() res: Response,
  ) {
    try {
      // Validate and set defaults
      limit = isNaN(limit) || limit <= 0 ? 10 : limit
      page = isNaN(page) || page <= 0 ? 1 : page
      name = name || ''
      sortBy = sortBy !== 'name' && sortBy !== 'createDate' ? 'name' : sortBy
      sort = sort !== 'ASC' && sort !== 'DESC' ? 'ASC' : sort

      let categories = await this.categoryService.getList(limit, page, name, cakeFaceId, isActive, sortBy, sort)
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
    } catch (error) {
      console.log(error)
      let response: RESPONSE_TYPE = {
        status: false,
        message: 'Bad Request',
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    let category = await this.categoryService.findOne(Number(id))
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
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() updateOptionDto: UpdateCakeFaceOptionDto,
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

      let option = await this.categoryService.update(Number(id), updateOptionDto, requester, image)
      if (option === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (option === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Cake Face Option Not Found',
        }
        res.status(HttpStatus.NOT_FOUND).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          params: option,
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

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    let success = await this.categoryService.remove(id)
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
