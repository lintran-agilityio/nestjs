import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class AuditLoggerService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(
    {
      userId,
      action,
      entity = '',
      entityId = null,
      data,
    }: {
      userId: string;
      action: string;
      entity?: string;
      entityId?: string;
      data?: any;
    },
    manager?: EntityManager,
  ): Promise<AuditLog> {
    const targetRepo = manager
      ? manager.getRepository(AuditLog)
      : this.auditLogRepository;

    const auditLog = targetRepo.create({
      userId,
      action,
      entity,
      entityId,
      data,
    });

    return targetRepo.save(auditLog);
  }
}
