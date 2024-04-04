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
import { Business } from "./Business";
// import { AppUser } from "./AppUser";
import { Location } from "./Location";
import { User } from "./User";
import { CustomerNotificationPreference } from "./CustomerNotificationPreference";

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
  locationId: string;

  @Column({ type: "uuid", nullable: true })
  @Index()
  businessId: string;

  @Column({ type: "uuid", nullable: true })
  @Index()
  appUserId: string;

  @ManyToOne(() => Business, (business) => business.customers, {
    nullable: true,
  })
  @JoinColumn({ name: "businessId" })
  business: Business;

  // @OneToMany(() => AppUser, (appUser) => appUser.customers, {
  //   nullable: true,
  // })
  // @JoinColumn({ name: "appUserId" })
  // appUser: AppUser;

  @ManyToOne(() => User, (user) => user.customers, {
    nullable: true,
  })
  @JoinColumn({ name: "appUserId" })
  appUser: User;

  @ManyToOne(() => Location, (location) => location.customers, { eager: true })
  @JoinColumn({ name: "locationId" })
  location: Location;

  @OneToOne(() => CustomerNotificationPreference)
  @JoinColumn()
  notificationPreference: CustomerNotificationPreference;
}
