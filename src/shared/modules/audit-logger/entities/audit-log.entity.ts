import { BaseEntity } from '@app/shared/entities';
import { Column, Entity } from 'typeorm';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'action', type: 'varchar', length: 255 })
  action: string;

  @Column({ name: 'entity', type: 'varchar', length: 255, nullable: true })
  entity: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string;

  @Column({ name: 'data', type: 'jsonb', nullable: true })
  data: any;
}
