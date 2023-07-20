import { NextFunction, Request, Response } from 'express';
import { getProject } from '../controllers/Project.controllers';
import InsufficientPermissionsException from '../exceptions/permissions/InsufficientPermissionsException';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import SectionNotFoundException from '../exceptions/sections/SectionNotFoundException';
import { getSection } from '../controllers/Section.controllers';

function projectPermissionMiddleware(type: 'get' | 'update' | 'create' | 'delete') {
  return async function checkPermissions(req: Request, _res: Response, next: NextFunction) {
    const { user } = req as RequestWithUser;

    const projectResult = await getProject(req.params.projectId);
    if (projectResult.type === 'error') {
      next(new ProjectNotFoundException(req.params.projectId));
      return;
    }

    const project = projectResult.data;

    if (type === 'get') {
      if (!project.users.map((u) => u.toString()).includes(user._id.toString())) {
        // TODO log
        next(new InsufficientPermissionsException(user, { type: 'project', _id: user._id }));
      }
    }

    // TODO other types, expanded permission check

    next();
  };
}

function sectionPermissionMiddleware(type: 'get' | 'update' | 'create' | 'delete') {
  return async function checkPermissions(req: Request, res: Response, next: NextFunction) {
    const { sectionId } = req.params;

    const sectionResult = await getSection(sectionId);

    if (sectionResult.type === 'error') {
      next(new SectionNotFoundException(sectionId));
    }

    return projectPermissionMiddleware(type)(req, res, next);
  };
}

export { projectPermissionMiddleware, sectionPermissionMiddleware };
