import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm'
import { UserInformationEntity } from './user-information.entity'

@Entity('user')
export class UserEntity {
  @PrimaryColumn()
  userName: string

  @Column()
  password: string

  @OneToOne(() => UserInformationEntity, (userInformation) => userInformation.user)
  @JoinColumn({ name: 'userName' })
  userInformation: UserInformationEntity
}
