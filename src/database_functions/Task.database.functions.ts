import * as mongoose from 'mongoose';
import ProjectModel from '../database/Project/Project.model';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result from '../interfaces/Result';

async function updateTask(taskId: string, {
  name, dueDate, assignee,
}:
{ name?: string, assignee?: string, dueDate?: string })
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

    const user = project.users.find((u) => u.toString() === assignee);

    if (!user) {
      return {
        type: 'error',
        errorType: 'ASSIGNEE_NOT_IN_PROJECT',
        errorData: project._id.toString(),
      };
    }

    if (name) task.name = name;

    try {
      if (assignee) task.assignee = new mongoose.Schema.Types.ObjectId(assignee);
    } catch (error) {
      return {
        type: 'error',
        errorType: 'ASSIGNEE_NOT_IN_PROJECT',
        errorData: project._id.toString(),
      };
    }

    if (dueDate) task.dueDate = new Date(dueDate);

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

export { deleteTask, updateTask };
