import { ObjectId } from 'mongoose';

interface Comment {
  _id: ObjectId

  text: string
  date: Date

  task: ObjectId
  owner: ObjectId
}

export default Comment;
