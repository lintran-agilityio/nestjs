import { setSeederFactory } from 'typeorm-extension';
import { faker } from '@faker-js/faker';

import { Post } from '@app/modules/posts/entities';

const generateContents = (): string => {
  const paragraphsCount = faker.number.int({ min: 1, max: 4 });
  const paragraphs: string[] = Array.from({ length: paragraphsCount }, () =>
    faker.lorem.paragraph(),
  );
  return paragraphs.join('\n\n');
};

export default setSeederFactory(Post, async (): Promise<Post> => {
  const post = new Post();
  post.title = faker.lorem.sentence({ min: 3, max: 8 });
  const baseSlug = faker.helpers.slugify(post.title).toLowerCase();
  post.slug = `${baseSlug}-${faker.string.alphanumeric(6).toLowerCase()}`;
  post.contents = generateContents();
  return post;
});
