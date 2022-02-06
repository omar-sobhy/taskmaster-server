import { ObjectId } from 'mongoose';
import * as mongoose from 'mongoose';

interface Tag {
  _id: ObjectId

  name: string

  project: mongoose.Types.ObjectId

  tasks: mongoose.Types.ObjectId[]
}

export default Tag;
