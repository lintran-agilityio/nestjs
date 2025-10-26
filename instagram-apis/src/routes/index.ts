// libs
import { Application } from 'express';

import { authenticationRouter } from './authentication.route';
import { userRouter } from './users.route';
import { postsRouter } from './posts.route';
import { commentsRouter } from './comments.route';

const routes = (app: Application) => {
  authenticationRouter(app);
  userRouter(app);
  postsRouter(app);
  commentsRouter(app);
};

export default routes;
