export class CreateSamplePatternDto {
  readonly name: string
  readonly isActive: '0' | '1'
}

export class HtmlToImageDto {
  readonly content: string
  readonly size: number
}
