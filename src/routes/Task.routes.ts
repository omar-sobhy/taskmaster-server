import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import { createTask } from '../controllers/Task.controllers';
import { updateTask } from '../database_functions/Task.database.functions';
import CreateTaskDto from '../dtos/Sections/CreateTask.dto';
import UpdateTaskDto from '../dtos/Tasks/UpdateTask.dto';
import TaskNotFoundException from '../exceptions/tasks/TaskNotFoundException';
import validationMiddleware from '../middleware/validation.middleware';

class TaskRoutes implements RouterWrapper {
  public path = '/sections/:sectionId/tasks';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.patch(
      `${this.path}`,
      validationMiddleware(UpdateTaskDto),
      TaskRoutes.updateTask,
    );
  }

  private static async updateTask(req: Request, res: Response, next: NextFunction) {
    const { taskId } = req.params;
    const { name, dueDate } = req.body;

    const taskOrError = await updateTask(name, dueDate);

    if (taskOrError.type === 'error') {
      next(new TaskNotFoundException(taskId));
      return;
    }

    const task = taskOrError.data;

    res.json({
      task,
    }).end();
  }
  
  private static async addTaskTag(req: Request, res: Response, next: NextFunction) {
    
  }
}
