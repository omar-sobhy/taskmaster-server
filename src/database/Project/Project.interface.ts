import { ObjectId } from 'mongoose';

interface Project {
  _id: ObjectId

  name: string
  background: string

  users: ObjectId[]
  sections: ObjectId[]
}

export default Project;
