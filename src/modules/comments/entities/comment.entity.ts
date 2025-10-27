// libs
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

import { User } from '@app/modules/users/entities';
import { Post } from '@app/modules/posts/entities';
import { BaseEntity } from '@app/shared/entities';

/**
 * Comment entity representing user comments on posts
 * Extends BaseEntity to inherit common fields (id, createdAt, updatedAt)
 */
@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  /**
   * Relationship to User entity
   * Cascade delete ensures comments are deleted when user is deleted
   */
  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Relationship to Post entity
   * Cascade delete ensures comments are deleted when post is deleted
   */
  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
