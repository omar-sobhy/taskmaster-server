import * as mongoose from 'mongoose';
import Comment from './Comment.interface';

const CommentSchema = new mongoose.Schema({
  text: String,
  date: Date,

  task: {
    ref: 'Task',
    type: mongoose.Schema.Types.ObjectId,
  },
  owner: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  },
});

const CommentModel = mongoose.model<Comment>('Comment', CommentSchema);

export default CommentModel;
