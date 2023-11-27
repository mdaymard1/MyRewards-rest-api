import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Special } from './Special';

@Entity({
  orderBy: {
    sortOrder: 'ASC',
  },
})
export class SpecialItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  specialId: string;

  @Column({ type: 'text', nullable: false })
  sortOrder: number;

  @Column({ type: 'text', nullable: false })
  itemId: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  itemDescription: string;

  @Column({ type: 'boolean', nullable: false })
  isManuallyEntered: boolean;

  @Column({ type: 'text', nullable: true })
  itemPriceRange: string;

  @Column({ type: 'text', nullable: true })
  priceCurrency: string;

  @Column({ type: 'text', nullable: true, default: null })
  imageUrl!: string | null;

  @ManyToOne(() => Special, (special) => special.items, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specialId' })
  special: Special;
}
