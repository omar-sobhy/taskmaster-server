import * as mongoose from 'mongoose';
import { Types } from 'mongoose';

import ProjectModel from '../database/Project/Project.model';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result, { Failure, Success } from '../interfaces/Result';
import Comment from '../database/Comment/Comment.interface';
import CommentModel from '../database/Comment/Comment.model';
import TagModel from '../database/Tag/Tag.model';

async function getTask(taskId: string): Promise<Result<Task, 'TASK_NOT_FOUND'>> {
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

/**
 * Get tasks by taskId.
 *
 * Returns `Failure<'TASK_NOT_FOUND>` if one of the `taskIds` is invalid
 * or not found in the database.
 *
 * @param taskIds the IDs of the tasks
 *
 * @returns the tasks, or `Failure<'TASK_NOT_FOUND'>`, or `Failure<'UNKNOWN_ERROR'>`
 */
async function getTasks(
  taskIds: string[],
): Promise<Result<Task[], 'TASK_NOT_FOUND' | 'UNKNOWN_ERROR'>> {
  try {
    const invalidIds = taskIds.filter((t) => !mongoose.isValidObjectId(t));
    if (invalidIds.length !== 0) {
      return {
        type: 'error',
        errorType: 'TASK_NOT_FOUND',
        errorData: invalidIds[0],
      };
    }

    const promises = taskIds.map(async (t) => {
      const task = await TaskModel.findById(t, '-__v');
      if (!task) {
        return {
          type: 'error',
          errorType: 'TASK_NOT_FOUND',
          errorData: t,
        } as Result<Task, 'TASK_NOT_FOUND'>;
      }

      return {
        type: 'success',
        data: task,
      } as Result<Task, 'TASK_NOT_FOUND'>;
    });

    const taskResults = await Promise.all(promises);

    const invalidTasks = taskResults.filter(
      (t) => t.type === 'error',
    ) as Failure<'TASK_NOT_FOUND'>[];

    if (invalidTasks.length !== 0) {
      return {
        type: 'error',
        errorType: 'TASK_NOT_FOUND',
        errorData: invalidTasks[0].errorData,
      };
    }

    const tasks = taskResults.map((t) => (t as Success<Task>).data);

    return {
      type: 'success',
      data: tasks,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'UNKNOWN_ERROR',
      errorData: error,
    };
  }
}

async function updateTask(
  taskId: string,
  {
    name, dueDate, assignee, description, tags,
  }: Partial<Task>,
): Promise<Result<Task, 'TASK_NOT_FOUND' | 'ASSIGNEE_NOT_IN_PROJECT' | 'TAG_NOT_FOUND'>> {
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

    if (tags) {
      const tagPromises = await Promise.all(tags.map((t) => TagModel.findById(t)));

      const invalidTag = tagPromises.find((t) => {
        if (!t) return true;

        if (t.project._id.toString() !== project.id) {
          console.log(`Tried to assign tag ${t.id} to non-parent project ${project.id}.`);
          return true;
        }

        return false;
      });

      if (invalidTag) {
        return {
          type: 'error',
          errorType: 'TAG_NOT_FOUND',
          errorData: invalidTag.id,
        };
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      task.tags = tags as mongoose.ObjectId;
    }

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

async function createComment(
  taskId: string,
  comment: string,
  owner: string,
): Promise<Result<Comment, 'TASK_NOT_FOUND'>> {
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
  deleteTask, updateTask, getTask, getTasks, createComment,
};
