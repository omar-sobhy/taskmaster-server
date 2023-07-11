import {
  NextFunction, Request, Response, Router,
} from 'express';
import Controller from '../controllers/RouterWrapper.interface';
import { createSections } from '../controllers/Project.controllers';
import UpdateSectionDto from '../dtos/Sections/UpdateSection.dto';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import SectionNotFoundException from '../exceptions/sections/SectionNotFoundException';
import validationMiddleware from '../middleware/validation.middleware';
import {
  createTask,
  deleteSection,
  getSection,
  getSections,
  updateSection,
} from '../database_functions/Section.database.functions';
import AssigneeNotInProjectException from '../exceptions/projects/AssigneeNotInProjectException';
import CreateTaskDto from '../dtos/Sections/CreateTask.dto';
import { getTasks } from '../database_functions/Task.database.functions';
import authMiddleware from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/RequestWithUser.interface';

class SectionRoutes implements Controller {
  public path = '/sections';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}`, SectionRoutes.getSections);

    this.router.get(`${this.path}/:sectionId`, SectionRoutes.getSection);

    this.router.get(`${this.path}/:sectionId/tasks`, SectionRoutes.getTasks);

    this.router.post(`${this.path}`, SectionRoutes.createSection);

    this.router.post(
      `${this.path}/:sectionId/tasks`,
      validationMiddleware(CreateTaskDto),
      SectionRoutes.createTask,
    );

    this.router.patch(
      `${this.path}/:sectionId`,
      validationMiddleware(UpdateSectionDto),
      SectionRoutes.updateSection,
    );

    this.router.delete(`${this.path}/:sectionId`, SectionRoutes.deleteSection);

    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);
  }

  private static async getTasks(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;

    const { user } = req as RequestWithUser;

    const tasksOrError = await getTasks(user._id.toString(), sectionId);

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

    const { user } = req as RequestWithUser;

    const sectionsOrError = await getSection(user._id.toString(), sectionId);
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

  private static async getSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.body;

    const sectionsOrError = await getSections(projectId);
    if (sectionsOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    const sections = sectionsOrError.data;

    res
      .json({
        sections,
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

  private static async createSection(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    const { name = '', colour = '', icon = '' } = req.body;

    const sections = await createSections(projectId, [
      {
        name,
        colour,
        icon,
      },
    ]);

    if (!sections) {
      next(new ProjectNotFoundException(projectId));
    } else {
      res
        .json({
          section: sections[0],
        })
        .end();
    }
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
