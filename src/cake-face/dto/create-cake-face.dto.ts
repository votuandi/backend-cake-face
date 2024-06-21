export class CreateCakeFaceDto {
  readonly name: string
  readonly detail: string
  readonly content: string
  readonly isActive: '0' | '1'
  readonly categoryId: string | number
}
