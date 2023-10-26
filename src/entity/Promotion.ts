import { Entity, Column, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Loyalty } from "./Loyalty";

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  loyaltyId: string;

  @Column({ type: 'text', nullable: true })
  promotionId: string;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ type: 'text', nullable: true })
  merchantName: string;

  @Column({ type: 'text', nullable: true, default: null })
  displayName!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  promotionStartsOn: Date;

  @Column({ type: 'jsonb', nullable: true })
  locationIds: { [key: string]: string };

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true, default: () => "now()" })
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true, default: () => "now()" })
  lastUpdateDate: Date;

  @ManyToOne(
    () => Loyalty,
    loyalty => loyalty.promotions,
    { nullable: true}
  )

  @JoinColumn({ name: 'loyaltyId' })
  loyalty: Loyalty;
}
