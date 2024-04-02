import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Business } from "./Business";
import { JSONEncryptionTransformer } from "typeorm-encrypted";
import { EncryptionTransformerConfig } from "../../encryption-config";

// @Index("customer_id_UNIQUE", ["merchantCustomerId", "businessId"], {
//   unique: true,
// })
@Entity()
export class EnrollmentRequest extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: false })
  ref: string;

  @Column({ type: "timestamp", nullable: false })
  enrollRequestedAt: Date;

  @Column({
    type: "json",
    nullable: false,
    transformer: new JSONEncryptionTransformer(EncryptionTransformerConfig),
  })
  details: object;

  @Column({ type: "uuid", nullable: true })
  locationId: string;

  @Column({ type: "uuid", nullable: true })
  @Index()
  appUserid: string;

  @Column({ type: "uuid", nullable: false })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, (business) => business.enrollmentRequests, {
    nullable: true,
  })
  @JoinColumn({ name: "businessId" })
  business: Business;
}
