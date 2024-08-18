import { CakeFaceCategoryEntity } from 'src/cake-face-category/cake-face-category.entity'
import { CakeFaceOptionEntity } from 'src/cake-face-option/cake-face-option.entity'
import { CakeFaceEntity } from 'src/cake-face/cake-face.entity'
import { SampleBackgroundEntity } from 'src/sample-background/sample-background.entity'
import { UserInformationEntity } from 'src/users/entities/user-information.entity'

export type RESPONSE_TYPE = {
  status: boolean
  message?: string
  params?: any
}

export type CATEGORY_LIST_RES = {
  data: CakeFaceCategoryEntity[]
  total: number
  totalActive: number
}

export type CAKE_FACE_LIST_RES = {
  data: CakeFaceEntity[]
  total: number
  totalActive: number
}

export type CAKE_FACE_OPTION_LIST_RES = {
  data: CakeFaceOptionEntity[]
  total: number
  totalActive: number
}

export type USER_LIST_RES = {
  data: UserInformationEntity[]
  total: number
  totalActive: number
}

export type SAMPLE_BACKGROUND_RES = {
  data: SampleBackgroundEntity[]
  total: number
  totalActive: number
}

export type SAMPLE_PATTERN_RES = {
  data: SamplePatternEntity[]
  total: number
  totalActive: number
}

export enum LOGO_TYPE {
  SMALL = 'small',
  FULL = 'full'
}