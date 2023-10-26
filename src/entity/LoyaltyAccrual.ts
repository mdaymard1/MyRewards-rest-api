import { Entity, Column, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Loyalty } from "./Loyalty";

@Entity()
export class LoyaltyAccrual {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  loyaltyId: string;

  @Column({ type: 'text', nullable: false })
  accrualType: string;

  @Column({ type: 'text', nullable: true })
  variantId: string;

  @Column({ type: 'text', nullable: true })
  categoryId: string;

  @Column({ type: 'text', nullable: true })
  merchantEarningPointsDescription: string;

  @Column({ type: 'text', nullable: true })
  merchantAdditionalEarningPointsDescription: string;

  @Column({ type: 'text', nullable: true, default: null })
  displayEarningPointsDescription!: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  displayEarningAdditionalEarningPointsDescription!: string | null;

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true, default: () => "now()" })
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true, default: () => "now()" })
  lastUpdateDate: Date;

  @ManyToOne(
    () => Loyalty,
    loyalty => loyalty.loyaltyAccruals,
    { nullable: true}
  )

  @JoinColumn({ name: 'loyaltyId' })
  loyalty: Loyalty;
}
