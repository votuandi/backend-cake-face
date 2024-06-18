export class LoginPayloadDto {
  readonly userName: string
  readonly password: string
}

export class RefreshTokenDto {
  refreshToken: string
}
