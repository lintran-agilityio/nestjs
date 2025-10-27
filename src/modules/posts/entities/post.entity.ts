// Libs
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { User } from '@app/modules/user/entities';
import { Comment } from '@app/modules/comments/entities';
import { BaseEntity } from '@app/shared/entities';

@Entity('posts')
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
