import { ObjectId } from 'mongoose';

interface Tag {
  _id: ObjectId

  name: string

  tasks: ObjectId[]
}

export default Tag;
