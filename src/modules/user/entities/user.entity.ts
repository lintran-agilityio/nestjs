// libs
import { Entity, Column, OneToMany } from 'typeorm';
import { UserRole, UserStatus } from '../../../shared/types';
import { BaseEntity } from '../../../shared/entities';
import { Post } from '../../post/entities';
import { Exclude } from 'class-transformer';

@Entity('users')
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

  @Column({ nullable: true })
  refreshToken?: string;

  // Relationship to Post
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
