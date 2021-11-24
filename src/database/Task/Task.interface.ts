import { ObjectId } from 'mongoose';

enum TaskStatus {
  IN_PROGRESS,
  DONE,
  ON_HOLD,
  DELETED,
}

interface Task {
  name: string
  status: TaskStatus
  dueDate: Date

  section: ObjectId

  assignee: ObjectId
  watchers: ObjectId[]
  checklistItems: ObjectId[]
  comments: ObjectId[]
  historyItems: ObjectId[]
  tags: ObjectId[]
}

export { TaskStatus };
export default Task;
