export class CreateCakeFaceOptionDto {
  readonly name: string
  readonly detail: string
  readonly cakeFaceId: string | number
  readonly isActive: '0' | '1'
}
