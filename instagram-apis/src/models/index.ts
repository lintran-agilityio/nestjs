import { Post } from "./Post.model";
import { User } from "./User.model";
import { Comment } from "./Comment.model";

Post.belongsTo(User, { foreignKey: 'authorId', targetKey: 'userId', as: 'author', onDelete: 'CASCADE' });
User.hasMany(Post, { foreignKey: 'authorId', sourceKey: 'userId', as: 'posts' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });

export {
    User,
    Post,
    Comment
};
