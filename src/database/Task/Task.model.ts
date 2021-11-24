import * as mongoose from 'mongoose';
import Task from './Task.interface';

const TaskSchema = new mongoose.Schema({
  name: String,
  status: String,
  dueDate: Date,

  section: {
    ref: 'Section',
    type: mongoose.Types.ObjectId,
  },

  assignee: {
    ref: 'User',
    type: mongoose.Types.ObjectId,
  },
  watchers: [{
    ref: 'User',
    type: mongoose.Types.ObjectId,
  }],
  checklistItems: [{
    ref: 'ChecklistItem',
    type: mongoose.Types.ObjectId,
  }],
  comments: [{
    ref: 'Comment',
    type: mongoose.Types.ObjectId,
  }],
  historyItems: [{
    ref: 'HistoryItem',
    type: mongoose.Types.ObjectId,
  }],
  tags: [{
    ref: 'Tag',
    type: mongoose.Types.ObjectId,
  }],
});
