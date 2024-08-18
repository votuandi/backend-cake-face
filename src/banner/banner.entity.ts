import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('banner')
export class BannerEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 512 })
  path: string

  @Column({ type: 'int' })
  index: number

  @Column({ type: 'timestamp', name: 'create_time' })
  createTime: Date
}
