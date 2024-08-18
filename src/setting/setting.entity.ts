import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('setting')
export class SettingEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'text' })
  value: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updateDate: Date

  @Column()
  updateBy: string
}
