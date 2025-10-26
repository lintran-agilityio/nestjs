// libs
import { Request, Response } from 'express';
import express, { Express } from 'express';

// utils
import { logger } from '@/utils';
import { sequelize } from '@/configs';
import { PORT } from '@/constants';
import routes from '@/routes';
import { apiDocsRouter } from '@/routes/api-doc.route';
import { globalErrorMiddleware, handleNotFoundRoute } from '@/middlewares';

const app: Express = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World! - Start doing working with Node.js and TypeScript');
});

// Api docs
apiDocsRouter(app);

routes(app);

/**
 * Handle middleware with Top-down priority
 * - Route not found errors (must come before error middleware)
 * - General error handling middleware (must be last)
 */
app.use(handleNotFoundRoute);
app.use(globalErrorMiddleware);

export const startServer = () => {
  sequelize.sync().then(() => {
    app.listen(3001, '0.0.0.0', () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  });
};

startServer();

export default app;
