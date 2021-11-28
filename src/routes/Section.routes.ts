import {
  NextFunction, Request, Response, Router,
} from 'express';
import Controller from '../controllers/Controller.interface';
import { createSections } from '../controllers/Project.controllers';
import { getSections } from '../controllers/Section.controllers';
import ProjectModel from '../database/Project/Project.model';
import Section from '../database/Section/Section.interface';
import CreateSectionsDto from '../dtos/Projects/CreateSections.dto';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import validationMiddleware from '../middleware/validation.middleware';

class SectionRoutes implements Controller {
  public path = '/projects/:projectId';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/sections`, SectionRoutes.getSections);

    this.router.post(
      `${this.path}/sections`,
      validationMiddleware(CreateSectionsDto),
      SectionRoutes.createSections,
    );
  }

  private static async getSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;

    const sections = await getSections(projectId);

    if (!sections) {
      next(new ProjectNotFoundException(projectId));
    } else {
      res.json({
        sections,
      }).end();
    }
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
}

export default SectionRoutes;
