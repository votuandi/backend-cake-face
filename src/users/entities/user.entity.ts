import { Entity, Column, PrimaryColumn, OneToOne } from 'typeorm'
import { UserInformationEntity } from './user-information.entity'

@Entity('user')
export class UserEntity {
  @PrimaryColumn()
  userName: string

  @Column()
  password: string

  @OneToOne(() => UserInformationEntity, (userInfo) => userInfo.user)
  userInformation: UserInformationEntity
}
