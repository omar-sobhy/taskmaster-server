import {
  NextFunction, Request, Response, Router,
} from 'express';
import Controller from '../controllers/RouterWrapper.interface';
import { createSections } from '../controllers/Project.controllers';
import CreateSectionsDto from '../dtos/Sections/CreateSections.dto';
import UpdateSectionDto from '../dtos/Sections/UpdateSection.dto';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import SectionNotFoundException from '../exceptions/sections/SectionNotFoundException';
import validationMiddleware from '../middleware/validation.middleware';
import { createTask, getSections, updateSection } from '../database_functions/Section.database.functions';
import AssigneeNotInProjectException from '../exceptions/projects/AssigneeNotInProjectException';
import CreateTaskDto from '../dtos/Sections/CreateTask.dto';

class SectionRoutes implements Controller {
  public path = '/sections';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, SectionRoutes.getSections);

    this.router.get(`${this.path}/:sectionId`, SectionRoutes.getSection);

    // this.router.post(
    //   `${this.path}`,
    //   validationMiddleware(CreateSectionsDto),
    //   SectionRoutes.createSections,
    // );

    this.router.post(
      `${this.path}`,
      validationMiddleware(CreateTaskDto),
      SectionRoutes.createTask,
    );

    this.router.patch(
      `${this.path}/:sectionId`,
      validationMiddleware(UpdateSectionDto),
      SectionRoutes.updateSection,
    );
  }

  private static async getSection(req: Request, res: Response, next: NextFunction) {
    const { projectId, sectionId } = req.params;

    const sectionsOrError = await getSections(projectId);
    if (sectionsOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    const sections = sectionsOrError.data;

    const section = sections.find((s) => s._id.toString() === sectionId);
    if (!section) {
      next(new SectionNotFoundException(sectionId));
    } else {
      res.json({
        section,
      }).end();
    }
  }

  private static async getSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;

    const sectionsOrError = await getSections(projectId);
    if (sectionsOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    const sections = sectionsOrError.data;

    res.json({
      sections,
    }).end();
  }

  private static async createSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    const { sectionData } = req.body;

    const sections = await createSections(projectId, sectionData);

    if (sections === null) {
      next(new ProjectNotFoundException(projectId));
    } else {
      res.json({
        sections,
      }).end();
    }
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

    res.json({
      section,
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
}

export default SectionRoutes;
