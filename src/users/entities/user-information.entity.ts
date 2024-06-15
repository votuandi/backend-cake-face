import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm'
import { UserEntity } from './user.entity'
import { Role } from 'src/auth/roles.enum'

@Entity('user_information')
export class UserInformationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userName: string

  @Column()
  name: string

  @Column()
  address: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createDate: Date

  @Column()
  createBy: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updateDate: Date

  @Column({ nullable: true })
  updateBy: string

  @Column()
  note: string

  @Column()
  avatar: string

  @Column()
  phoneNumber: string

  @Column()
  email: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role

  @OneToOne(() => UserEntity, (user) => user.userInformation)
  @JoinColumn({ name: 'userName' })
  user: UserEntity
}
