import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Point,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Business } from "./Business";
import { Customer } from "./Customer";

@Entity()
export class Location extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  locationPoint: Point;

  @Column({ type: "text", nullable: false })
  merchantLocationId: string;

  @Column({ type: "text", nullable: true })
  name: string;

  @Column({ type: "text", nullable: true })
  businessName: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  addressLine1: string;

  @Column({ type: "text", nullable: true })
  addressLine2: string;

  @Column({ type: "text", nullable: true })
  city: string;

  @Column({ type: "text", nullable: true })
  state: string;

  @Column({ type: "text", nullable: true })
  zipCode: string;

  @Column({ type: "text", nullable: true })
  country: string;

  @Column({ type: "text", nullable: true })
  phoneNumber: string;

  @Column({ type: "simple-json", nullable: true })
  hoursOfOperation?: {
    dayOfWeek: string;
    startLocalTime: string;
    endLocalTime: string;
  }[];

  @Column({ type: "text", nullable: true })
  timezone: string;

  @Column({ type: "text", nullable: true })
  businessEmail: string;

  @Column({ type: "text", nullable: false })
  status: string;

  @Column({ type: "boolean", nullable: true })
  isLoyaltyActive: boolean;

  @Column({ type: "boolean", nullable: true })
  showLoyaltyInApp: boolean;

  @Column({ type: "boolean", nullable: true })
  showPromotionsInApp: boolean;

  @Column({ type: "boolean", nullable: false })
  showThisLocationInApp: boolean;

  @Column({ type: "text", nullable: true })
  firstImageUrl!: string | null;

  @Column({ type: "text", nullable: true })
  secondImageUrl!: string | null;

  @Column({ type: "text", nullable: true })
  logoUrl!: string | null;

  @Column({ type: "text", nullable: true })
  fullFormatLogoUrl!: string | null;

  @Column({ type: "uuid", nullable: false })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, (business) => business.locations, {
    nullable: true,
  })
  @JoinColumn({ name: "businessId" })
  business: Business;

  @OneToMany(() => Customer, (customer) => customer.location, {
    nullable: true,
  })
  @JoinColumn({ name: "customerId" })
  customers: Customer[];
}
