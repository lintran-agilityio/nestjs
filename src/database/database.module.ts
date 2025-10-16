// libs
import { Module, Global } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

// Database service
import { DatabaseServices } from './database.service';

@Global()
@Module({
  imports: [
    // Initialize CLS context for all requests
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: 'DRIZZLE',
          }),
        }),
      ],
    }),
  ],
  providers: [
    DatabaseServices,
    // Expose Drizzle instance via DI
    {
      provide: 'DRIZZLE',
      useFactory: (databaseServices: DatabaseServices) => databaseServices.db,
      inject: [DatabaseServices],
    },
    // Adapter now provided via Cls plugin above
  ],
  exports: [DatabaseServices, 'DRIZZLE'],
})
export class DatabaseModule {}
