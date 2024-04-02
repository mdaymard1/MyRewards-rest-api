import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "./Customer";

@Entity()
export class CustomerNotificationPreference extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  @Index()
  businessId: string;

  @Column({ type: "uuid", nullable: false })
  customerId: string;

  @Column({ type: "boolean", nullable: true })
  notifyOfRewardChanges: boolean;

  @Column({ type: "boolean", nullable: true })
  notifyOfPromotionChanges: boolean;

  @Column({ type: "boolean", nullable: true })
  notifyOfSpecialsChanges: boolean;

  @Column({ type: "uuid", nullable: false })
  appUserId: string;

  @OneToOne(() => Customer)
  @JoinColumn()
  customer: Customer;
}
