// Libs
import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';

// App sources
import { BaseEntity } from '@app/shared/entities';
import { UserRole, UserStatus } from '@app/shared/types';

// Local sources
import { Post } from '@app/apis/posts/entities';
import { Comment } from '@app/apis/comments/entities';
import { PATHS } from '@app/shared/constants';

@Entity(PATHS.USERS)
export class User extends BaseEntity {
  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Exclude()
  @Column({ nullable: true })
  refreshToken?: string;

  // Relationship to Post
  @Exclude()
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  // Relationship to Comment
  @Exclude()
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];
}
