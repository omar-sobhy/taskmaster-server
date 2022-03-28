import {
  NextFunction, Request, Response, Router,
} from 'express';
import mongoose from 'mongoose';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import ProjectModel from '../database/Project/Project.model';
import {
  createProject, createSections, createTag, getProjects,
} from '../database_functions/Project.database.functions';
import CreateProjectDto from '../dtos/Projects/CreateProject.dto';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import UserNotFoundException from '../exceptions/users/UserNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';
import Section from '../database/Section/Section.interface';
import CreateSectionsDto from '../dtos/Projects/CreateSections.dto';
import TagModel from '../database/Tag/Tag.model';
import CreateTagDto from '../dtos/Projects/CreateTag.dto';

class ProjectRoutes implements RouterWrapper {
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

    this.router.get(`${this.path}/:projectId/sections`, ProjectRoutes.getSections);

    this.router.get(`${this.path}/:projectId/tags`, ProjectRoutes.getTags);

    this.router.post(
      `${this.path}/:projectId/sections/create`,
      validationMiddleware(CreateSectionsDto),
      ProjectRoutes.createSections,
    );

    this.router.post(
      `${this.path}/:projectId/tags`,
      validationMiddleware(CreateTagDto),
      ProjectRoutes.createTag,
    );

    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);
  }

  private static async createProject(req: Request, res: Response, next: NextFunction) {
    const { _id: userId } = (req as RequestWithUser).user;

    const projectOrError = await createProject(
      userId.toString(),
      req.body.name,
      req.body.background,
    );

    if (projectOrError.type === 'error') {
      next(new UserNotFoundException(userId.toString()));
      return;
    }

    const project = projectOrError.data;

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

    const sectionsOrError = await createSections(projectId, sectionData);
    if (sectionsOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    const sections = sectionsOrError.data;
    project.sections = sections.map((s) => s._id);

    res.json({
      project,
    }).end();
  }

  private static async getProjectsForUser(req: Request, res: Response, next: NextFunction) {
    const { _id: userId } = (req as RequestWithUser).user;

    const projectsOrError = await getProjects(userId.toString());
    if (projectsOrError.type === 'error') {
      next(new UserNotFoundException(userId.toString()));
      return;
    }

    const projects = projectsOrError.data;

    res.json({
      projects,
    }).end();
  }

  private static async createSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;

    const { sectionData } = req.body;

    const sectionsOrError = await createSections(projectId, sectionData);
    if (sectionsOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    const sections = sectionsOrError.data;

    res.json({
      sections,
    }).end();
  }

  private static async getProjectData(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    try {
      const project = await ProjectModel.findById(projectId);
      res.json({
        project,
      }).end();
    } catch (error) {
      next(new ProjectNotFoundException(projectId));
    }
  }

  private static async getSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    try {
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        next(new ProjectNotFoundException(projectId));
        return;
      }

      const populatedProject = await project.populate<{ sections: Section[] }>('sections', '-__v');
      res.json({
        sections: populatedProject.sections,
      }).end();
    } catch (error) {
      next(new ProjectNotFoundException(projectId));
    }
  }

  public static async getTags(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    try {
      const tags = await TagModel.find({
        project: new mongoose.Types.ObjectId(projectId),
      });

      res.json({
        tags,
      }).end();
    } catch (error) {
      next(new ProjectNotFoundException(projectId));
    }
  }

  public static async createTag(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    const { name } = req.body;

    const tagOrError = await createTag(projectId, name);
    if (tagOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    res.json({
      tag: tagOrError.data,
    }).end();
  }
}

export default ProjectRoutes;
