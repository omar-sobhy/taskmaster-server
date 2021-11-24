import { ObjectId } from 'mongoose';

interface Section {
  name: string
  colour: string
  icon: string

  project: ObjectId
  tasks: ObjectId[]
}

export default Section;
