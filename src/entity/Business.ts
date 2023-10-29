import { BaseEntity, Entity, Column, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Loyalty } from "./Loyalty";

@Entity()
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  businessId: string;

  // @CreateDateColumn({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  createDate: Date;

  // @LastUpdatedDate({ type: 'timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastUpdateDate: Date;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ type: 'text', nullable: false })
  merchantId: string;

  @Column({ type: 'text', nullable: true })
  merchantAccessToken: string;

  @Column({ type: 'text', nullable: true })
  merchantRefreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  accessTokenExpirationDate: Date;

  @OneToOne(() => Loyalty)
  @JoinColumn()
  loyalty: Loyalty
}
