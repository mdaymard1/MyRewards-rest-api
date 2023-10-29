import { BaseEntity, Entity, Column, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Loyalty } from "./Loyalty";

@Entity()
export class LoyaltyRewardTier extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  loyaltyId: string;

  @Column({ type: 'text', nullable: false })
  rewardTierId: string;

  @Column({ type: 'text', nullable: true })
  merchantReward: string;

  @Column({ type: 'text', nullable: true })
  merchantRewardDescription: string;

  @Column({ type: 'text', nullable: true, default: null })
  displayReward!: string | null;;

  @Column({ type: 'text', nullable: true, default: null })
  displayRewardDescription!: string | null;

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true , default: () => "now()"})
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true, default: () => "now()" })
  lastUpdateDate: Date;

  @ManyToOne(
    () => Loyalty,
    loyalty => loyalty.loyaltyRewardTiers,
    { nullable: true}
  )

  @JoinColumn({ name: 'loyaltyId' })
  loyalty: Loyalty;
}
