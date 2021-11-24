import { ObjectId } from 'mongoose';

interface User {
  email: string
  username: string
  password: string

  projects: ObjectId[]
}

export default User;
