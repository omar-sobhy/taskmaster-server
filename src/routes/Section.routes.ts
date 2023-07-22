import {
  NextFunction, Request, Response, Router,
} from 'express';
import Controller from '../controllers/RouterWrapper.interface';
import UpdateSectionDto from '../dtos/Sections/UpdateSection.dto';
import SectionNotFoundException from '../exceptions/sections/SectionNotFoundException';
import validationMiddleware from '../middleware/validation.middleware';
import {
  createTask,
  deleteSection,
  getSection,
  getTasks,
  updateSection,
} from '../controllers/Section.controllers';
import AssigneeNotInProjectException from '../exceptions/projects/AssigneeNotInProjectException';
import CreateTaskDto from '../dtos/Sections/CreateTask.dto';
import authMiddleware from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import { sectionPermissionMiddleware } from '../middleware/permission.middleware';

class SectionRoutes implements Controller {
  public path = '/sections';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(
      `${this.path}/:sectionId`,
      sectionPermissionMiddleware('get'),
      SectionRoutes.getSection,
    );

    this.router.get(
      `${this.path}/:sectionId/tasks`,
      sectionPermissionMiddleware('get'),
      SectionRoutes.getTasks,
    );

    this.router.post(
      `${this.path}/:sectionId/tasks`,
      validationMiddleware(CreateTaskDto),
      sectionPermissionMiddleware('update'),
      SectionRoutes.createTask,
    );

    this.router.patch(
      `${this.path}/:sectionId`,
      validationMiddleware(UpdateSectionDto),
      sectionPermissionMiddleware('update'),
      SectionRoutes.updateSection,
    );

    this.router.delete(
      `${this.path}/:sectionId`,
      sectionPermissionMiddleware('delete'),
      SectionRoutes.deleteSection,
    );

    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);
  }

  private static async getTasks(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;

    const tasksOrError = await getTasks(sectionId);

    if (tasksOrError.type === 'error') {
      next(new SectionNotFoundException(sectionId));
      return;
    }

    const tasks = tasksOrError.data;

    res
      .json({
        tasks,
      })
      .end();
  }

  private static async getSection(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;

    const sectionsOrError = await getSection(sectionId);
    if (sectionsOrError.type === 'error') {
      next(new SectionNotFoundException(sectionId));
      return;
    }

    res
      .json({
        section: sectionsOrError.data,
      })
      .end();
  }

  private static async updateSection(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;

    const { name, colour, icon } = req.body;

    const sectionOrError = await updateSection(sectionId, name, colour, icon);
    if (sectionOrError.type === 'error') {
      next(new SectionNotFoundException(sectionId));
      return;
    }

    const section = sectionOrError.data;

    res
      .json({
        section,
      })
      .end();
  }

  private static async createTask(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;
    const { name, dueDate, assignee } = req.body;

    const taskOrError = await createTask(
      sectionId,
      name,
      dueDate ? new Date(dueDate) : undefined,
      assignee,
    );

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

    res
      .json({
        task,
      })
      .end();
  }

  private static async deleteSection(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;

    const { user } = req as RequestWithUser;

    const result = await deleteSection(sectionId, user._id.toString());

    if (result.type === 'error') {
      next(new SectionNotFoundException(sectionId));
    } else {
      res
        .json({
          section: result.data,
        })
        .end();
    }
  }
}

export default SectionRoutes;
