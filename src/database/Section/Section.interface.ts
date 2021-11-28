import { ObjectId } from 'mongoose';

interface Section {
  _id: ObjectId

  name: string
  colour: string
  icon: string

  project: ObjectId
  tasks: ObjectId[]
}

export default Section;
