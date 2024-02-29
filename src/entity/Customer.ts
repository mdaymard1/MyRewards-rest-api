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

  @Column({ type: 'timestamp', nullable: true })
  createdDate: Date;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, (business) => business.specials, {
    nullable: true,
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}
