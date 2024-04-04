import {
  BaseEntity,
  Entity,
  Column,
  Index,
  OneToMany,
  Point,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Customer } from "./Customer";
import { JSONEncryptionTransformer } from "typeorm-encrypted";
import { EncryptionTransformerConfig } from "../../encryption-config";
import { CustomerNotificationPreference } from "./CustomerNotificationPreference";

@Index("user_ref_UNIQUE", ["ref"], {
  unique: true,
})
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: false })
  ref: string;

  @Column({
    type: "json",
    nullable: true,
    transformer: new JSONEncryptionTransformer(EncryptionTransformerConfig),
  })
  userDetails: object;

  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  locationPoint?: Point;

  @Column({ type: "boolean", nullable: true })
  notifyOfNewBusinesses: boolean;

  @Column({ type: "boolean", nullable: true })
  notifyOfMyRewardChanges: boolean;

  @Column({ type: "boolean", nullable: true })
  notifyOfPointChanges: boolean;

  @Column({ type: "text", nullable: true })
  zipCode?: string;

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: "timestamp", nullable: true })
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: "timestamp", nullable: false })
  lastUpdateDate: Date;

  @OneToMany(() => Customer, (customer) => customer.appUser, { eager: true })
  customers: Customer[];

  @OneToMany(
    () => CustomerNotificationPreference,
    (customerNotificationPref) => customerNotificationPref.appUser,
    { eager: true }
  )
  customerNotificationPrefs: CustomerNotificationPreference[];
}
