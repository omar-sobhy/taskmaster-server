import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongoose';
import { getProject, getTags } from '../controllers/Project.controllers';
import InsufficientPermissionsException from '../exceptions/permissions/InsufficientPermissionsException';
import ProjectNotFoundException from '../exceptions/projects/ProjectNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import SectionNotFoundException from '../exceptions/sections/SectionNotFoundException';
import { getSection, getSections } from '../controllers/Section.controllers';
import { getTask, getTasks } from '../controllers/Task.controllers';
import TaskNotFoundException from '../exceptions/tasks/TaskNotFoundException';
import Project from '../database/Project/Project.interface';
import User from '../database/User/User.interface';
import HttpException from '../exceptions/HttpException';
import Result, { Failure, Success } from '../interfaces/Result';

type RequestTypes = 'get' | 'update' | 'create' | 'delete';

/**
 * Extracts params from the Request using the given key.
 *
 * If the Request contains a `params` value matching the given key, returns that value as an array.
 * Otherwise, if the Request query contains the given key, returns that value as an array.
 *
 * Returns null if the Request does not have a parameter matching the given key.
 *
 * @param req the request to extract params from
 * @param key the key to use to extract params
 *
 * @returns an array of string values containing the extracted params, or null
 */
function extractParams(req: Request, key: string): string[] | null {
  if (req.params[key]) {
    return [req.params[key]];
  }

  if (req.query[key]) {
    if (typeof req.query[key] === 'string') {
      return [req.query[key] as unknown as string];
    }

    return req.query[key] as unknown as string[];
  }

  return null;
}

/**
 *
 * Checks access permissions for one or more projects.
 *
 * Returns `Success<undefined>` if the check passes.
 *
 * Returns `Failure<'PROJECT_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>` if the check fails.
 * errorData will contain the bad projectIds.
 *
 * @param user the user trying to access the projects
 * @param projectIds the IDs of the projects to check
 *
 * @returns `Result<undefined, 'PROJECT_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>`
 */
async function checkPermissionsForManyProjects(
  user: User,
  projectIds: string[],
): Promise<Result<undefined, 'PROJECT_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>> {
  // TODO change to use getProjects in Project controller
  const projectResults = await Promise.all(projectIds.map(async (p) => getProject(p)));

  const unknownProjects = projectResults.filter((p) => p.type === 'error');

  if (unknownProjects.length !== 0) {
    return {
      type: 'error',
      errorType: 'PROJECT_NOT_FOUND',
      errorData: unknownProjects.map((p) => (p as Failure<'PROJECT_NOT_FOUND'>).errorData),
    };
  }

  const badProjectResults = projectResults.filter((p) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const p_ = (p as Success<Project>).data;

    return !p_.users.map((u) => u.toString()).includes(user._id.toString());
  });

  if (badProjectResults.length !== 0) {
    return {
      type: 'error',
      errorType: 'USER_NOT_IN_PROJECT',
      errorData: badProjectResults.map((r) => (r as Success<Project>).data._id.toString()),
    };
  }

  return {
    type: 'success',
    data: undefined,
  };
}

/**
 * Express middleware. Checks that the user in the request has permission to perform
 * the requested operation on the requested project.
 *
 * If the check fails, will call next() with one of `ProjectNotFoundException`
 * or `InsufficientPermissionsException`.
 */
function projectPermissionMiddleware(type: RequestTypes) {
  return async function checkPermissions(req: Request, _res: Response, next: NextFunction) {
    if (type === 'create') {
      next();
      return;
    }

    // TODO more types and more granular permission checks

    const { user } = req as RequestWithUser;

    const projectIds = extractParams(req, 'projectId');
    if (!projectIds) {
      next(new ProjectNotFoundException(''));
      return;
    }

    const checkResult = await checkPermissionsForManyProjects(user, projectIds);

    if (checkResult.type === 'error') {
      const data = checkResult.errorData;
      if (checkResult.errorType === 'PROJECT_NOT_FOUND') {
        next(new ProjectNotFoundException((data as string[])[0]));
        return;
      }

      const entities = (data as string[]).map((s) => ({ type: 'project', _id: s }));

      next(new InsufficientPermissionsException(user, entities));

      return;
    }

    next();
  };
}

/**
 * Checks access permissions for one or more sections.
 *
 * Returns `Success<undefined>` if the check passes.
 *
 * Returns `Failure<'SECTION_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>` if the check fails.
 * errorData will contain the bad sectionIds.
 *
 * @param user the user trying to access the sections
 * @param sectionIds the IDs of the sections to check
 *
 * @returns `Result<undefined, 'SECTION_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>`
 */
async function checkPermissionsForManySections(
  user: User,
  sectionIds: string[],
): Promise<Result<undefined, 'SECTION_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>> {
  const sectionResults = await getSections(sectionIds);

  if (sectionResults.type === 'error') {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
      errorData: sectionResults.errorData,
    };
  }

  const projectIds = sectionResults.data.map((s) => s.project.toString());

  const checkResult = await checkPermissionsForManyProjects(user, projectIds);

  if (checkResult.type === 'error') {
    if (checkResult.errorType === 'PROJECT_NOT_FOUND') {
      // TODO use pino
      console.log(`Something went wrong. Sections without projects? ${sectionIds.join(', ')}`);
      return {
        type: 'error',
        errorType: 'SECTION_NOT_FOUND',
        errorData: sectionIds,
      };
    }

    // eslint-disable-next-line arrow-body-style
    const badSectionIds = sectionResults.data
      .filter((s) => (checkResult.errorData as string[]).includes(s.project.toString()))
      .map((s) => s._id.toString());

    return {
      type: 'error',
      errorType: 'USER_NOT_IN_PROJECT',
      errorData: badSectionIds,
    };
  }

  return {
    type: 'success',
    data: undefined,
  };
}

/**
 * Express middleware. Checks that the user in the request has permission to perform
 * the requested operation on the requested section.
 *
 * If the check fails, will call next() with one of `SectionNotFoundException`
 * or `InsufficientPermissionsException`.
 */
function sectionPermissionMiddleware(type: RequestTypes) {
  return async function checkPermissions(req: Request, res: Response, next: NextFunction) {
    if (type === 'create') {
      next();
      return;
    }

    // TODO more types and more granular permission checks

    const { user } = req as RequestWithUser;

    const sectionIds = extractParams(req, 'sectionId');
    if (!sectionIds) {
      next(new SectionNotFoundException(''));
      return;
    }

    const checkResult = await checkPermissionsForManySections(user, sectionIds);

    if (checkResult.type === 'error') {
      const data = checkResult.errorData as string[];
      if (checkResult.errorType === 'SECTION_NOT_FOUND') {
        next(new SectionNotFoundException(data[0]));
        return;
      }

      const entities = data.map((s) => ({ type: 'section', _id: s }));

      next(new InsufficientPermissionsException(user, entities));

      return;
    }

    next();
  };
}

/**
 * Checks access permissions for one or more tasks.
 *
 * Returns `Success<undefined>` if the check passes.
 *
 * Returns `Failure<'Task_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>` if the check fails.
 * errorData will contain the bad taskIds.
 *
 * @param user the user trying to access the tasks
 * @param taskIds the IDs of the tasks to check
 *
 * @returns `Result<undefined, 'TASK_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>`
 */
async function checkPermissionsForManyTasks(
  user: User,
  taskIds: string[],
): Promise<Result<undefined, 'USER_NOT_IN_PROJECT' | 'TASK_NOT_FOUND' | 'UNKNOWN_ERROR'>> {
  const taskResults = await getTasks(taskIds);

  if (taskResults.type === 'error') {
    if (taskResults.errorType === 'TASK_NOT_FOUND') {
      return {
        type: 'error',
        errorType: 'TASK_NOT_FOUND',
        errorData: taskResults.errorData,
      };
    }

    return {
      type: 'error',
      errorType: 'UNKNOWN_ERROR',
    };
  }

  const sectionIds = taskResults.data.map((t) => t.section.toString());

  const checkResult = await checkPermissionsForManySections(user, sectionIds);

  if (checkResult.type !== 'error') {
    return {
      type: 'success',
      data: undefined,
    };
  }

  if (checkResult.errorType === 'SECTION_NOT_FOUND') {
    // TODO use pino
    console.log(`Something went wrong. Tasks without sections? ${taskIds.join(', ')}`);
    return {
      type: 'error',
      errorType: 'TASK_NOT_FOUND',
      errorData: taskIds,
    };
  }

  const badSections = checkResult.errorData as string[];

  const badTaskIds = taskResults.data
    .filter((t) => badSections.includes(t._id.toString()))
    .map((t) => t._id.toString());

  return {
    type: 'error',
    errorType: 'USER_NOT_IN_PROJECT',
    errorData: badTaskIds,
  };
}

/**
 * Express middleware. Checks that the user in the request has permission to perform
 * the requested operation on the requested task.
 *
 * If the check fails, will call next() with one of `TaskNotFoundException`
 * or `InsufficientPermissionsException`.
 */
function taskPermissionMiddleware(type: RequestTypes) {
  return async function checkPermissions(req: Request, res: Response, next: NextFunction) {
    if (type === 'create') {
      next();
      return;
    }

    // TODO more types and more granular permission checks

    const { user } = req as RequestWithUser;

    const taskIds = extractParams(req, 'taskId');
    if (!taskIds) {
      next(new TaskNotFoundException(''));
      return;
    }

    const checkResult = await checkPermissionsForManyTasks(user, taskIds);

    if (checkResult.type === 'error') {
      const data = checkResult.errorData as string[];
      if (checkResult.errorType === 'TASK_NOT_FOUND') {
        next(new TaskNotFoundException(data[0]));
        return;
      }

      const entities = data.map((s) => ({ type: 'task', _id: s }));

      next(new InsufficientPermissionsException(user, entities));

      return;
    }

    next();
  };
}

// function tagPermissionMiddleware(type: RequestTypes) {
//   return async function checkPermissions(req: Request, res: Response, next: NextFunction) {
//     if (type !== 'create') {
//       const { tagId } = req.params;

//       const tagResult = await getTag;
//     }

//     sectionPermissionMiddleware(type)(req, res, next);
//   };
// }

export { projectPermissionMiddleware, sectionPermissionMiddleware, taskPermissionMiddleware };
