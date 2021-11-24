import * as mongoose from 'mongoose';
import Comment from './Comment.interface';

const CommentSchema = new mongoose.Schema({
  text: String,
  task: {
    ref: 'Task',
    type: mongoose.Types.ObjectId,
  },
});

const CommentModel = mongoose.model<Comment>('Comment', CommentSchema);

export default CommentModel;
