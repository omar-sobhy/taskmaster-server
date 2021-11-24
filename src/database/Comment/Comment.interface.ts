import { ObjectId } from 'mongoose';

interface Comment {
  text: string
  task: ObjectId
}

export default Comment;
