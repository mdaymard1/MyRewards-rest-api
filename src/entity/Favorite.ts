import {
  BaseEntity,
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Location } from "./Location";
import { User } from "./User";

@Index("appUser_locationId_id_UNIQUE", ["appUser", "locationId"], {
  unique: true,
})
@Entity()
export class Favorite extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  @Index()
  appUserId: string;

  @Column({ type: "uuid", nullable: false })
  @Index()
  locationId: string;

  @OneToOne(() => Location, { onDelete: "CASCADE" })
  @JoinColumn()
  location: Location;

  @ManyToOne(() => User, (user) => user.favorites, {
    nullable: true,
  })
  @JoinColumn({ name: "appUserId" })
  appUser: User;
}
