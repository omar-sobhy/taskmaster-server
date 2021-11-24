import { ObjectId } from 'mongoose';

interface Project {
  name: string
  background: string

  users: ObjectId[]
}

export default Project;
