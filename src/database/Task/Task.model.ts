import * as mongoose from 'mongoose';
import Task from './Task.interface';

const TaskSchema = new mongoose.Schema({
  name: String,
  status: String,
  dueDate: Date,
  description: String,

  created: Date,
  updated: Date,

  section: {
    ref: 'Section',
    type: mongoose.Schema.Types.ObjectId,
  },

  assignee: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  },
  watchers: [{
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  }],
  checklistItems: [{
    ref: 'ChecklistItem',
    type: mongoose.Schema.Types.ObjectId,
  }],
  comments: [{
    ref: 'Comment',
    type: mongoose.Schema.Types.ObjectId,
  }],
  tags: [{
    ref: 'Tag',
    type: mongoose.Schema.Types.ObjectId,
  }],
});

const TaskModel = mongoose.model<Task>('Task', TaskSchema);

export default TaskModel;
