import * as mongoose from 'mongoose';
import { Types } from 'mongoose';

import ProjectModel from '../database/Project/Project.model';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result from '../interfaces/Result';
import Comment from '../database/Comment/Comment.interface';
import CommentModel from '../database/Comment/Comment.model';

async function getTaskData(taskId: string): Promise<Result<Task, 'TASK_NOT_FOUND'>> {
  try {
    const task = await TaskModel.findById(taskId, '-__v');
    if (!task) {
      return {
        type: 'error',
        errorType: 'TASK_NOT_FOUND',
      };
    }

    return {
      type: 'success',
      data: task,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'TASK_NOT_FOUND',
    };
  }
}

async function getTasks(sectionId: string)
  : Promise<Result<Task[], 'SECTION_NOT_FOUND'>> {
  try {
    const section = await SectionModel.findById(sectionId, '-__v');
    if (!section) {
      return {
        type: 'error',
        errorType: 'SECTION_NOT_FOUND',
      };
    }

    const taskIds = section.tasks;

    const promises = taskIds.map((id) => TaskModel.findById(id, '-__v'));

    return {
      type: 'success',
      data: await Promise.all(promises) as Task[],
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
    };
  }
}

async function updateTask(taskId: string, {
  name, dueDate, assignee, description,
}:
{ name?: string, assignee?: string, dueDate?: string, description?: string })
  : Promise<Result<Task, 'TASK_NOT_FOUND' | 'ASSIGNEE_NOT_IN_PROJECT'>> {
  try {
    const task = await TaskModel.findById(taskId, '-__v');
    if (!task) {
      return {
        type: 'error',
        errorType: 'TASK_NOT_FOUND',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const section = (await SectionModel.findById(task.section))!;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const project = (await ProjectModel.findById(section.project))!;

    if (name) task.name = name;

    try {
      if (assignee === null) {
        task.assignee = undefined;
      } else if (assignee !== undefined) {
        task.assignee = new Types.ObjectId(assignee);
      }
    } catch (error) {
      return {
        type: 'error',
        errorType: 'ASSIGNEE_NOT_IN_PROJECT',
        errorData: project._id.toString(),
      };
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (dueDate === null || dueDate === '') task.dueDate = undefined;
    else if (dueDate) task.dueDate = new Date(dueDate);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (description === null || description === '') task.description = undefined;
    else if (description) task.description = description;

    task.updated = new Date();

    await task.save();
    return {
      type: 'success',
      data: task,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'TASK_NOT_FOUND',
    };
  }
}

async function deleteTask(taskId: string): Promise<Result<Task, 'TASK_NOT_FOUND'>> {
  try {
    const task = await TaskModel.findByIdAndDelete(taskId);
    if (!task) {
      return {
        type: 'error',
        errorType: 'TASK_NOT_FOUND',
      };
    }

    return {
      type: 'success',
      data: task,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'TASK_NOT_FOUND',
    };
  }
}

async function createComment(taskId: string, comment: string, owner: string)
  : Promise<Result<Comment, 'TASK_NOT_FOUND'>> {
  try {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return {
        type: 'error',
        errorType: 'TASK_NOT_FOUND',
      };
    }

    const newComment = new CommentModel({
      text: comment,
      date: new Date(),
      task: taskId,
      owner,
    });

    await newComment.save();

    task.comments.push(newComment.id);

    await task.save();
    return {
      type: 'success',
      data: newComment,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'TASK_NOT_FOUND',
    };
  }
}

export {
  deleteTask, updateTask, getTasks, getTaskData, createComment,
};
