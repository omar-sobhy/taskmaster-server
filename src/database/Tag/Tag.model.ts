import * as mongoose from 'mongoose';
import Tag from './Tag.interface';

const TagSchema = new mongoose.Schema({
  name: String,

  tasks: [{
    ref: 'Task',
    type: mongoose.Types.ObjectId,
  }],
});

const TagModel = mongoose.model<Tag>('Tag', TagSchema);

export default TagModel;
