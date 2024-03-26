import {
  BaseEntity,
  Entity,
  Column,
  JoinColumn,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Loyalty } from "./Loyalty";
import { Special } from "./Special";
import { Customer } from "./Customer";
import { Location } from "./Location";
import { EnrollmentRequest } from "./EnrollmentRequest";

@Entity()
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  businessId: string;

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: "timestamp", nullable: true })
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: "timestamp", nullable: false })
  lastUpdateDate: Date;

  @Column({ type: "text", nullable: true })
  name: string;

  @Column({ type: "text", nullable: false })
  merchantId: string;

  @Column({ type: "text", nullable: true })
  merchantAccessToken: string;

  @Column({ type: "text", nullable: true })
  merchantRefreshToken: string;

  @Column({ type: "timestamp", nullable: true })
  accessTokenExpirationDate: Date;

  @Column({ type: "boolean", nullable: false })
  loyaltyUsesCatalogItems: boolean;

  @Column({ type: "boolean", nullable: false })
  specialsUseCatalogItems: boolean;

  @Column({ type: "text", nullable: true })
  businessName: string;

  @Column({ type: "text", nullable: true })
  appStoreUrl: string;

  @Column({ type: "text", nullable: true })
  googlePlayStoreUrl: string;

  @Column({ type: "text", nullable: true })
  reviewsUrl: string;

  @OneToOne(() => Loyalty)
  @JoinColumn()
  loyalty: Loyalty;

  @OneToMany(() => Special, (special) => special.business, { eager: true })
  specials: Special[];

  @OneToMany(() => Customer, (customer) => customer.business, { eager: true })
  customers: Customer[];

  @OneToMany(() => Location, (location) => location.business, { eager: true })
  locations: Location[];

  @OneToMany(
    () => EnrollmentRequest,
    (enrollmentRequest) => enrollmentRequest.business,
    { eager: true }
  )
  enrollmentRequests: EnrollmentRequest[];
}
