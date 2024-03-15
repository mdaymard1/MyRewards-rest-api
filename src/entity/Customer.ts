import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SpecialItem } from "./SpecialItem";
import { Business } from "./Business";

@Index("customer_id_UNIQUE", ["merchantCustomerId", "businessId"], {
  unique: true,
})
@Entity()
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  merchantCustomerId: string;

  @Column({ type: "text", nullable: true })
  ref: string;

  @Column({ type: "integer", nullable: true })
  balance: number;

  @Column({ type: "integer", nullable: true })
  lifetimePoints: number;

  @Column({ type: "timestamp", nullable: true })
  enrolledAt: Date;

  @Column({ type: "integer", nullable: true })
  enrollmentSource: number;

  @Column({ type: "uuid", nullable: true })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, (business) => business.customers, {
    nullable: true,
  })
  @JoinColumn({ name: "businessId" })
  business: Business;
}
