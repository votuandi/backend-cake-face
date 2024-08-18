import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('sample_background')
export class SampleBackgroundEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 50 })
  name: string

  @Column({ type: 'varchar', length: 500 })
  image: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createDate: Date

  @Column()
  createBy: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updateDate: Date

  @Column()
  updateBy: string
}
