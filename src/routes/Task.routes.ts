import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import { createComment, getTask, updateTask } from '../controllers/Task.controllers';
import CreateCommentDto from '../dtos/Tasks/CreateComment.dto';
import UpdateTaskDto from '../dtos/Tasks/UpdateTask.dto';
import TaskNotFoundException from '../exceptions/tasks/TaskNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';
import { taskPermissionMiddleware } from '../middleware/permission.middleware';
import AssigneeNotInProjectException from '../exceptions/projects/AssigneeNotInProjectException';
import TagsNotFoundException from '../exceptions/tags/TagsNotFoundException';

class TaskRoutes implements RouterWrapper {
  public path = '/tasks';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}/:taskId`, TaskRoutes.getTaskData);

    this.router.patch(
      `${this.path}/:taskId`,
      validationMiddleware(UpdateTaskDto),
      taskPermissionMiddleware('update'),
      TaskRoutes.updateTask,
    );

    this.router.post(
      `${this.path}/:taskId/comments`,
      validationMiddleware(CreateCommentDto),
      taskPermissionMiddleware('update'),
      TaskRoutes.createComment,
    );
  }

  private static async updateTask(req: Request, res: Response, next: NextFunction) {
    const { taskId } = req.params;
    const {
      name, assignee, dueDate, description, tags,
    } = req.body;

    const taskOrError = await updateTask(taskId, {
      name,
      assignee,
      dueDate,
      description,
      tags,
    });

    if (taskOrError.type === 'error') {
      if (taskOrError.errorType === 'TASK_NOT_FOUND') {
        next(new TaskNotFoundException(taskId));
      } else if (taskOrError.errorType === 'ASSIGNEE_NOT_IN_PROJECT') {
        next(new AssigneeNotInProjectException(assignee, taskOrError.errorData as string));
      } else {
        next(new TagsNotFoundException(tags));
      }

      return;
    }

    const task = taskOrError.data;

    res
      .json({
        task,
      })
      .end();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private static async addTaskTag(req: Request, res: Response, next: NextFunction) {}

  private static async getTaskData(req: Request, res: Response, next: NextFunction) {
    const { taskId } = req.params;

    const taskOrError = await getTask(taskId);
    if (taskOrError.type === 'error') {
      next(new TaskNotFoundException(taskId));
      return;
    }

    const task = taskOrError.data;

    res
      .json({
        task,
      })
      .end();
  }

  private static async createComment(req: Request, res: Response, next: NextFunction) {
    const { taskId } = req.params;
    const { text: comment } = req.body;

    const { user } = req as RequestWithUser;

    const commentOrError = await createComment(taskId, comment, user._id.toString());

    if (commentOrError.type === 'error') {
      next(new TaskNotFoundException(taskId));
      return;
    }

    const commentObject = commentOrError.data;

    res
      .json({
        comment: commentObject,
      })
      .end();
  }
}

export default TaskRoutes;
