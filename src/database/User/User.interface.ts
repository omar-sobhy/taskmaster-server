import { ObjectId } from 'mongoose';

interface User {
  _id: ObjectId

  email: string
  username: string
  password: string

  projects: ObjectId[]
}

export default User;
