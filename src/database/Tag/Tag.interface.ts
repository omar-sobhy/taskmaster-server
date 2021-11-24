import { ObjectId } from 'mongoose';

interface Tag {
  name: string

  tasks: ObjectId[]
}

export default Tag;
