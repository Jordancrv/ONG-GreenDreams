import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription, SubscriptionStatus } from './subscription.entity';

@Entity({ name: 'subscriptions_logs' })
export class SubscriptionLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'created_at', type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @ManyToOne(() => Subscription, { nullable: false, onDelete: 'CASCADE' })
  subscription!: Subscription;

  @Column({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMonthly?: number | null;

  @Column({ type: 'varchar', length: 3, nullable: true, default: 'USD' })
  currency?: string | null;

  @Column({ name: 'plan_name', type: 'varchar', length: 255, nullable: true })
  planName?: string | null;

  @Column({ type: 'enum', enum: SubscriptionStatus, nullable: false })
  status!: SubscriptionStatus;
}
