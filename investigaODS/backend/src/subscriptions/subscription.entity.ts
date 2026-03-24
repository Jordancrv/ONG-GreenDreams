import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';
import { MembershipPlan } from '../plans/membership-plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity({ name: 'subscriptions' })
export class Subscription extends BaseEntity {
  @ManyToOne(() => User, (user) => user.subscriptions, { eager: true, nullable: false })
  user!: User;

  @ManyToOne(() => MembershipPlan, (plan) => plan.subscriptions, { eager: true, nullable: false })
  plan!: MembershipPlan;

  @Column({ name: 'start_at', type: 'datetime' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'datetime', nullable: true })
  endAt?: Date;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;
}
