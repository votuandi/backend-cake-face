import { CakeFaceCategoryEntity } from 'src/cake-face-category/cake-face-category.entity'
import { CakeFaceOptionEntity } from 'src/cake-face-option/cake-face-option.entity'
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'

@Entity('cake_face')
export class CakeFaceEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 50 })
  name: string

  @Column({ type: 'text' })
  detail: string

  @Column({ type: 'longtext' })
  content: string

  @Column({ type: 'varchar', length: 500 })
  thumbnail: string

  @Column({ type: 'varchar', length: 100, default: '' })
  store: string

  @Column({ type: 'text' })
  configFilePath: string

  @Column({ type: 'boolean', default: false })
  isTrendy: boolean

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

  @Column({ default: 0 })
  viewAmount: number

  @Column({ default: 0 })
  downloadAmount: number

  @ManyToOne(() => CakeFaceCategoryEntity, (category) => category.cakeFaces)
  category: CakeFaceCategoryEntity

  @OneToMany(() => CakeFaceOptionEntity, (option) => option.cakeFace)
  options: CakeFaceOptionEntity[]
}
