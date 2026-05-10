import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'audit_log' })
@Index('idx_audit_log_created_at', ['createdAt'])
@Index('idx_audit_log_actor', ['actorId'])
export class AuditLogOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'actor_id', nullable: true })
  actorId!: string | null;

  @Column('text')
  action!: string;

  @Column('text', { name: 'target_type', nullable: true })
  targetType!: string | null;

  @Column('text', { name: 'target_id', nullable: true })
  targetId!: string | null;

  @Column('jsonb', { nullable: true })
  payload!: Record<string, unknown> | null;

  @Column('timestamptz', { name: 'created_at' })
  createdAt!: Date;
}
