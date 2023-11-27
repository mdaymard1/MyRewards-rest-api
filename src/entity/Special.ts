import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  PrimaryGeneratedColumn,
  Generated,
} from 'typeorm';
import { SpecialItem } from './SpecialItem';
import { Business } from './Business';

@Entity({
  orderBy: {
    sortOrder: 'ASC',
  },
})
export class Special extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  // @Generated('increment')
  @Generated('increment')
  sortOrder: number;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', nullable: false })
  showItemDetails: boolean;

  @Column({ type: 'boolean', nullable: false })
  showItemPhotos: boolean;

  @Column({ type: 'boolean', nullable: false })
  showItemPrices: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  businessId: string;

  @OneToMany(() => SpecialItem, (item) => item.special, { eager: true })
  items: SpecialItem[];

  // @OneToOne(() => Business, (business) => business.loyalty)
  // business: Business;

  @ManyToOne(() => Business, (business) => business.specials, {
    nullable: true,
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}
