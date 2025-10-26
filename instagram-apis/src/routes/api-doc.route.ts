// libs
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

import { API_ENDPOINTS } from '@/constants';
import { swaggerSpec } from '@/apiDoc/swapper';

export const apiDocsRouter = (app: Application) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }));
};
