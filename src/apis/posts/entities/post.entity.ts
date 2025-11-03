// Libs
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { User } from '@app/apis/users/entities';
import { Comment } from '@app/apis/comments/entities';
import { BaseEntity } from '@app/shared/entities';
import { PATHS } from '@app/shared/constants';

@Entity(PATHS.POSTS)
export class Post extends BaseEntity {
  @Column({ name: 'slug', type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'contents', type: 'text' })
  contents: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  // Relationship to User
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  // Relationship to Comments
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}
