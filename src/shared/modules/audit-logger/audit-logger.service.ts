import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities';
import { Repository } from 'typeorm';

@Injectable()
export class AuditLoggerService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction({
    userId,
    action,
    entity,
    entityId,
    data,
  }: {
    userId: string;
    action: string;
    entity?: string;
    entityId?: string;
    data?: any;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      entity,
      entityId,
      data,
    });

    return this.auditLogRepository.save(auditLog);
  }
}
