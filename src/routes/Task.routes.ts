import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import { createTask } from '../controllers/Task.controllers';
import {
  createComment, getTaskData, getTasks, updateTask,
} from '../database_functions/Task.database.functions';
import CreateTaskDto from '../dtos/Sections/CreateTask.dto';
import GetTasksDto from '../dtos/Sections/GetTasks.dto';
import CreateCommentDto from '../dtos/Tasks/CreateComment.dto';
import UpdateTaskDto from '../dtos/Tasks/UpdateTask.dto';
import AssigneeNotInProjectException from '../exceptions/projects/AssigneeNotInProjectException';
import SectionNotFoundException from '../exceptions/sections/SectionNotFoundException';
import TaskNotFoundException from '../exceptions/tasks/TaskNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';

class TaskRoutes implements RouterWrapper {
  public path = '/tasks';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(
      `${this.path}`,
      validationMiddleware(GetTasksDto),
      TaskRoutes.getTasks,
    );

    this.router.get(
      `${this.path}/:taskId`,
      TaskRoutes.getTaskData,
    );

    this.router.patch(
      `${this.path}/:taskId`,
      validationMiddleware(UpdateTaskDto),
      TaskRoutes.updateTask,
    );

    this.router.post(
      `${this.path}`,
      validationMiddleware(CreateTaskDto),
      TaskRoutes.createTask,
    );

    this.router.post(
      `${this.path}/:taskId/comments`,
      validationMiddleware(CreateCommentDto),
      TaskRoutes.createComment,
    );
  }

  private static async getTasks(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.body;

    const { user } = req as RequestWithUser;

    const tasksOrError = await getTasks(user._id.toString());

    if (tasksOrError.type === 'error') {
      next(new SectionNotFoundException(sectionId));
      return;
    }

    const tasks = tasksOrError.data;

    res.json({
      tasks,
    }).end();
  }

  private static async updateTask(req: Request, res: Response, next: NextFunction) {
    const { taskId } = req.params;
    const {
      name, assignee, dueDate, description, tags: tagIds,
    } = req.body;

    console.log(dueDate);

    const taskOrError = await updateTask(taskId, {
      name, assignee, dueDate, description, tagIds,
    });

    if (taskOrError.type === 'error') {
      next(new TaskNotFoundException(taskId));
      return;
    }

    const task = taskOrError.data;

    res.json({
      task,
    }).end();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private static async addTaskTag(req: Request, res: Response, next: NextFunction) {
  }

  private static async getTaskData(req: Request, res: Response, next: NextFunction) {
    const { taskId } = req.params;

    const taskOrError = await getTaskData(taskId);
    if (taskOrError.type === 'error') {
      next(new TaskNotFoundException(taskId));
      return;
    }

    const task = taskOrError.data;

    res.json({
      task,
    }).end();
  }

  private static async createTask(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;
    const { name, dueDate, assignee } = req.body;

    const taskOrError = await createTask(sectionId, name, dueDate, assignee);
    if (taskOrError.type === 'error') {
      if (taskOrError.errorType === 'SECTION_NOT_FOUND') {
        next(new SectionNotFoundException(sectionId));
      } else {
        const projectId = taskOrError.errorData as string;

        next(new AssigneeNotInProjectException(assignee, projectId));
      }
      return;
    }

    const task = taskOrError.data;

    res.json({
      task,
    }).end();
  }

  private static async createComment(req: Request, res: Response, next: NextFunction) {
    const { taskId } = req.params;
    const { text: comment } = req.body;

    const { user } = (req as RequestWithUser);

    const commentOrError = await createComment(taskId, comment, user._id.toString());

    if (commentOrError.type === 'error') {
      next(new TaskNotFoundException(taskId));
      return;
    }

    const commentObject = commentOrError.data;

    res.json({
      comment: commentObject,
    }).end();
  }
}

export default TaskRoutes;
