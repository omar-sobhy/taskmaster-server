import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import ProjectModel from '../database/Project/Project.model';
import CreateProjectDto from '../dtos/Projects/CreateProject.dto';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import UserNotFoundException from '../exceptions/users/UserNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';
import CreateSectionsDto from '../dtos/Projects/CreateSections.dto';
import CreateTagDto from '../dtos/Projects/CreateTag.dto';
import InsufficientPermissionsException from '../exceptions/permissions/InsufficientPermissionsException';
import {
  createProject,
  createSections,
  createTag,
  getProject,
  getProjects,
  getSections,
  getTags,
} from '../controllers/Project.controllers';

class ProjectRoutes implements RouterWrapper {
  public path = '/projects';

  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}`, authMiddleware, ProjectRoutes.getProjectsForUser);

    this.router.post(
      `${this.path}`,
      validationMiddleware(CreateProjectDto),
      ProjectRoutes.createProject,
    );

    this.router.get(
      `${this.path}/:projectId`,
      ProjectRoutes.permissionMiddleware('get'),
      ProjectRoutes.getProjectData,
    );

    this.router.get(
      `${this.path}/:projectId/sections`,
      ProjectRoutes.permissionMiddleware('get'),
      ProjectRoutes.getSections,
    );

    this.router.get(
      `${this.path}/:projectId/tags`,
      ProjectRoutes.permissionMiddleware('get'),
      ProjectRoutes.getTags,
    );

    this.router.post(
      `${this.path}/:projectId/sections`,
      validationMiddleware(CreateSectionsDto),
      ProjectRoutes.permissionMiddleware('update'),
      ProjectRoutes.createSections,
    );

    this.router.post(
      `${this.path}/:projectId/tags`,
      validationMiddleware(CreateTagDto),
      ProjectRoutes.permissionMiddleware('update'),
      ProjectRoutes.createTag,
    );

    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);
  }

  private static permissionMiddleware(type: 'get' | 'update' | 'create' | 'delete') {
    return async function checkPermissions(req: Request, _res: Response, next: NextFunction) {
      const { user } = req as RequestWithUser;

      const projectResult = await getProject(req.params.projectId);
      if (projectResult.type === 'error') {
        throw new ProjectNotFoundException(req.params.projectId);
      }

      const project = projectResult.data;

      if (type === 'get') {
        if (!project.users.map((u) => u.toString()).includes(user._id.toString())) {
          // TODO log
          throw new InsufficientPermissionsException(user, { type: 'project', _id: user._id });
        }
      }

      // TODO other types, expanded permission check

      next();
    };
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

    // extract sectionData, dropping extraneous properties
    // or map to default sectionData
    const sectionData = req.body.sectionData?.map(
      (d: { name: string; colour: string; icon: string }) => ({
        name: d.name,
        colour: d.colour,
        icon: d.icon,
        project: projectId,
      }),
    ) ?? [
      {
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
        colour: '#2ed7d8',
        icon: '',
        project: projectId,
      },
    ];

    const sectionsOrError = await createSections(projectId, sectionData);
    if (sectionsOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    const sections = sectionsOrError.data;
    project.sections = sections.map((s) => s._id);

    res
      .json({
        project,
      })
      .end();
  }

  private static async getProjectsForUser(req: Request, res: Response, next: NextFunction) {
    const { _id: userId } = (req as RequestWithUser).user;

    const projectsOrError = await getProjects(userId.toString());
    if (projectsOrError.type === 'error') {
      next(new UserNotFoundException(userId.toString()));
      return;
    }

    const projects = projectsOrError.data;

    res
      .json({
        projects,
      })
      .end();
  }

  private static async createSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;

    const { sections: sectionData } = req.body;

    const sectionsOrError = await createSections(projectId, sectionData);
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

  private static async getProjectData(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    try {
      const project = await ProjectModel.findById(projectId);
      res
        .json({
          project,
        })
        .end();
    } catch (error) {
      next(new ProjectNotFoundException(projectId));
    }
  }

  private static async getSections(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;

    const sectionsResult = await getSections(projectId);

    if (sectionsResult.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    res
      .json({
        sections: sectionsResult.data,
      })
      .end();
  }

  public static async getTags(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;

    const tagsResult = await getTags(projectId);

    if (tagsResult.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    res
      .json({
        tags: tagsResult.data,
      })
      .end();
  }

  public static async createTag(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    const { name } = req.body;

    const tagOrError = await createTag(projectId, name);
    if (tagOrError.type === 'error') {
      next(new ProjectNotFoundException(projectId));
      return;
    }

    res
      .json({
        tag: tagOrError.data,
      })
      .end();
  }
}

export default ProjectRoutes;
