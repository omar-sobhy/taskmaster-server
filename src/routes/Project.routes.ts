import {
  NextFunction, Request, Response, Router,
} from 'express';
import Controller from '../controllers/Controller.interface';
import { createProject, createSections, getProjects } from '../controllers/Project.controllers';
import Project from '../database/Project/Project.interface';
import ProjectModel from '../database/Project/Project.model';
import CreateProjectDto from '../dtos/Projects/CreateProject.dto';
import CreateSectionsDto from '../dtos/Projects/CreateSections.dto';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';

class ProjectRoutes implements Controller {
  public path = '/projects';

  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}/`, authMiddleware, ProjectRoutes.getProjectsForUser);

    this.router.post(
      `${this.path}/`,
      validationMiddleware(CreateProjectDto),
      ProjectRoutes.createProject,
    );

    this.router.get(`${this.path}/:projectId`, ProjectRoutes.getProjectData);

    // this.router.post(
    //   `${this.path}/:projectId/sections/create`,
    //   validationMiddleware(CreateSectionsDto),
    //   ProjectRoutes.createSections,
    // );
  }

  private static async createProject(req: Request, res: Response) {
    const { _id: userId } = (req as RequestWithUser).user;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const project = (await createProject(userId.toString(), req.body.name))!;

    const projectId = project._id.toString();

    const sectionData = req.body.sectionData?.map(
      (d: { name: string; colour: string; icon: string; }) => ({
        name: d.name,
        colour: d.colour,
        icon: d.icon,
        project: projectId,
      }),
    ) ?? [{
      name: 'Open',
      colour: '#bef9f2',
      icon: '',
      project: projectId,
    },
    {
      name: 'In progress',
      colour: '#35b6ff',
      icon: '',
      project: projectId,
    },
    {
      name: 'Done',
      colour: '#d6a1ff',
      icon: '',
      project: projectId,
    },
    {
      name: 'On hold',
      colour: '#fff0a1',
      icon: '',
      project: projectId,
    }];

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const sections = (await createSections(projectId, sectionData))!;

    project.sections = sections.map((s) => s._id);

    res.json({
      project,
    }).end();
  }

  private static async getProjectsForUser(req: Request, res: Response) {
    const { _id: userId } = (req as RequestWithUser).user;

    const projects = await getProjects(userId.toString());

    res.json({
      projects,
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

  private static async getProjectData(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    if (!projectId) {
      next(new ProjectNotFoundException(projectId));
    } else {
      const project = await ProjectModel.findById(projectId);
      res.json({
        project,
      }).end();
    }
  }
}

export default ProjectRoutes;
