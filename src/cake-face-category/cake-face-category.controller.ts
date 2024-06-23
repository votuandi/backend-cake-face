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
import { CakeFaceCategoryService } from './cake-face-category.service'
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { CATEGORY_LIST_RES, RESPONSE_TYPE } from 'src/types/commom'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/roles.decorator'
import { Role } from 'src/auth/roles.enum'
import { CreateCakeFaceCategoryDto } from './dto/create-cake-face-category.dto'
import { UpdateCakeFaceCategoryDto } from './dto/update-cake-face-category.dto'

@Controller('cake-face-category')
export class CakeFaceCategoryController {
  constructor(private readonly categoryService: CakeFaceCategoryService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @UploadedFile() thumbnail: Express.Multer.File,
    @Body() createCategoryDto: CreateCakeFaceCategoryDto,
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

      let newCategory = await this.categoryService.create(createCategoryDto, requester, thumbnail)
      if (newCategory === null) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Internal Server Error',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else if (newCategory === undefined) {
        let response: RESPONSE_TYPE = {
          status: false,
          message: 'Create category failed',
        }
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response)
      } else {
        let response: RESPONSE_TYPE = {
          status: true,
          message: 'Create category successfully',
          params: newCategory,
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
    // Validate and set defaults
    limit = isNaN(limit) || limit <= 0 ? 99999 : limit
    page = isNaN(page) || page <= 0 ? 1 : page
    name = name || ''
    sortBy = sortBy !== 'name' && sortBy !== 'createDate' ? 'name' : sortBy
    sort = sort !== 'ASC' && sort !== 'DESC' ? 'ASC' : sort

    let categoriesList: CATEGORY_LIST_RES = await this.categoryService.getList(
      limit,
      page,
      name,
      isActive,
      sortBy,
      sort,
    )
    if (Array.isArray(categoriesList.data)) {
      let response: RESPONSE_TYPE = {
        status: true,
        params: { ...categoriesList, limit: limit },
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
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id') id: string,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Body() updateCategoryDto: UpdateCakeFaceCategoryDto,
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

      let category = await this.categoryService.update(Number(id), updateCategoryDto, requester, thumbnail)

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
