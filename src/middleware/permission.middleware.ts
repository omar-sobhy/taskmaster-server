import { NextFunction, Request, Response } from 'express';
import { getProject, getTags } from '../controllers/Project.controllers';
import InsufficientPermissionsException from '../exceptions/permissions/InsufficientPermissionsException';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import SectionNotFoundException from '../exceptions/sections/SectionNotFoundException';
import { getSection } from '../controllers/Section.controllers';
import { getTask } from '../controllers/Task.controllers';
import TaskNotFoundException from '../exceptions/tasks/TaskNotFoundException';

function projectPermissionMiddleware(type: 'get' | 'update' | 'create' | 'delete') {
  return async function checkPermissions(req: Request, _res: Response, next: NextFunction) {
    const { user } = req as RequestWithUser;

    if (type !== 'create') {
      const projectResult = await getProject(req.params.projectId);
      if (projectResult.type === 'error') {
        next(new ProjectNotFoundException(req.params.projectId));
        return;
      }

      const project = projectResult.data;

      if (!project.users.map((u) => u.toString()).includes(user._id.toString())) {
        // TODO log
        next(new InsufficientPermissionsException(user, { type: 'project', _id: user._id }));
        return;
      }

      // TODO other types, expanded permission check

      next();
    }
  };
}

function sectionPermissionMiddleware(type: 'get' | 'update' | 'create' | 'delete') {
  return async function checkPermissions(req: Request, res: Response, next: NextFunction) {
    if (type !== 'create') {
      const { sectionId } = req.params;

      const sectionResult = await getSection(sectionId);

      if (sectionResult.type === 'error') {
        next(new SectionNotFoundException(sectionId));
        return;
      }

      req.params.sectionId = sectionId;
    }

    projectPermissionMiddleware(type)(req, res, next);
  };
}

function taskPermissionMiddleware(type: 'get' | 'update' | 'create' | 'delete') {
  return async function checkPermissions(req: Request, res: Response, next: NextFunction) {
    if (type !== 'create') {
      const { taskId } = req.params;

      const taskResult = await getTask(taskId);

      if (taskResult.type === 'error') {
        next(new TaskNotFoundException(taskId));
        return;
      }
    }

    sectionPermissionMiddleware(type)(req, res, next);
  };
}

export { projectPermissionMiddleware, sectionPermissionMiddleware, taskPermissionMiddleware };
