import {
  BaseEntity,
  Entity,
  Column,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Customer } from "./Customer";
import { JSONEncryptionTransformer } from "typeorm-encrypted";
import { EncryptionTransformerConfig } from "../../encryption-config";

@Index("appuser_ref_UNIQUE", ["ref"], {
  unique: true,
})
@Entity()
export class AppUser extends BaseEntity {
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

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: "timestamp", nullable: true })
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: "timestamp", nullable: false })
  lastUpdateDate: Date;

  @OneToOne(() => Customer, (customer) => customer.appUser, { eager: true })
  customer: Customer;
}
