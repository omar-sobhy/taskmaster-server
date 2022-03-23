import { Types } from 'mongoose';

enum TaskStatus {
  IN_PROGRESS,
  DONE,
  ON_HOLD,
  DELETED,
}

interface Task {
  name: string
  description: string
  status: TaskStatus
  dueDate: Date

  created: Date
  updated: Date

  section: Types.ObjectId
  assignee?: Types.ObjectId
  watchers: Types.ObjectId[]
  checklistItems: Types.ObjectId[]
  comments: Types.ObjectId[]
  tags: Types.ObjectId[]
}

export { TaskStatus };
export default Task;
