import { Entity, Column, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LoyaltyAccrual } from "./LoyaltyAccrual";
import { LoyaltyRewardTier } from "./LoyaltyRewardTier";
import { Promotion } from "./Promotion";
import { Business } from "./Business";

@Entity()
export class Loyalty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', nullable: false })
  showLoyaltyInApp: boolean;

  @Column({ type: 'boolean', nullable: false })
  showPromotionsInApp: boolean;

  @Column({ type: 'boolean', nullable: true })
  automaticallyUpdateChangesFromMerchant: boolean;

  @Column({ type: 'text', nullable: true })
  terminologyOne: string;

  @Column({ type: 'text', nullable: true })
  terminologyMany: string;

  @Column({ type: 'text', nullable: true })
  loyaltyStatus: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  businessId: string;

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true, default: () => "now()" })
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true, default: () => "now()" })
  lastUpdateDate: Date;

  @OneToMany(
    () => LoyaltyAccrual,
    loyaltyAccrual => loyaltyAccrual.loyalty,
    { eager: true}
  )
  loyaltyAccruals: LoyaltyAccrual[];

  @OneToMany(
    () => Promotion,
    promotion => promotion.loyalty,
    { eager: true}
  )
  promotions: Promotion[];

  @OneToMany(
    () => LoyaltyRewardTier,
    loyaltyRewardTier => loyaltyRewardTier.loyalty,
    { eager: true}
  )
  loyaltyRewardTiers: LoyaltyRewardTier[];

  @OneToOne(() => Business, (business) => business.loyalty)
    business: Business
}
