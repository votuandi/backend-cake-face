import { CakeFaceEntity } from 'src/cake-face/cake-face.entity'
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'

@Entity('cake_face_option')
export class CakeFaceOptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50 })
  name: string

  @Column({ type: 'text' })
  detail: string

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

  @ManyToOne(() => CakeFaceEntity, (cakeFace) => cakeFace.options)
  cakeFace: CakeFaceEntity
}
