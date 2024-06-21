import { CakeFaceEntity } from 'src/cake-face/cake-face.entity'
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'

@Entity('cake_face_category')
export class CakeFaceCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 50 })
  name: string

  @Column({ type: 'varchar', length: 500, default: '/public/image/cake-face-category/default.png' })
  thumbnail: string

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

  @OneToMany(() => CakeFaceEntity, (cakeFace) => cakeFace.category)
  cakeFaces: CakeFaceCategoryEntity[]
}
