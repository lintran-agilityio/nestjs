import { setSeederFactory } from 'typeorm-extension';
import { faker } from '@faker-js/faker';

import { Comment } from '@app/modules/comments/entities';

export default setSeederFactory(Comment, async (): Promise<Comment> => {
  const comment = new Comment();
  comment.content = faker.lorem.sentences({ min: 1, max: 3 });
  return comment;
});
