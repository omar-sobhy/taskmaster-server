import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';
import Tag from './Tag.interface';

const TagSchema = new mongoose.Schema({
  name: String,

  project: {
    ref: 'Project',
    type: ObjectId,
  },

  tasks: [{
    ref: 'Task',
    type: ObjectId,
  }],

  colour: String,
});

const TagModel = mongoose.model<Tag>('Tag', TagSchema);

export default TagModel;
