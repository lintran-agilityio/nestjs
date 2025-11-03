import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

import { User } from '@app/apis/users/entities';
import { Post } from '@app/apis/posts/entities';
import { Comment } from '@app/apis/comments/entities';

const getRandomInt = (min: number, max: number): number => {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
};

export default class MainSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const userFactory = factoryManager.get<User>(User);
    const postFactory = factoryManager.get<Post>(Post);
    const commentFactory = factoryManager.get<Comment>(Comment);

    const users: User[] = await userFactory.saveMany(10);

    const allPosts: Post[] = [];
    for (const user of users) {
      const numPosts = getRandomInt(1, 4);
      const posts: Post[] = await Promise.all(
        Array.from({ length: numPosts }, () => postFactory.make()),
      );
      for (const post of posts) {
        post.authorId = user.id;
        post.author = user;
      }
      const saved: Post[] = await dataSource.getRepository(Post).save(posts);
      allPosts.push(...saved);
    }

    for (const post of allPosts) {
      const numComments = getRandomInt(0, 5);
      const comments: Comment[] = await Promise.all(
        Array.from({ length: numComments }, () => commentFactory.make()),
      );
      for (const comment of comments) {
        const randomUser = users[getRandomInt(0, users.length - 1)];
        comment.userId = randomUser.id;
        comment.user = randomUser;
        comment.postId = post.id;
        comment.post = post;
      }

      if (comments.length > 0) {
        await dataSource.getRepository(Comment).save(comments);
      }
    }
  }
}
