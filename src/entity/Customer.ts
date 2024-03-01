import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SpecialItem } from './SpecialItem';
import { Business } from './Business';

@Index('customer_id_UNIQUE', ['merchantCustomerId', 'businessId'], {
  unique: true,
})
@Entity()
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  merchantCustomerId: string;

  @Column({ type: 'text', nullable: false })
  ref: string;

  @Column({ type: 'integer', nullable: false })
  balance: number;

  @Column({ type: 'integer', nullable: false })
  lifetimePoints: number;

  @Column({ type: 'timestamp', nullable: false })
  enrolledAt: Date;

  @Column({ type: 'boolean', nullable: false })
  enrolledFromApp: boolean;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, (business) => business.customers, {
    nullable: true,
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}
