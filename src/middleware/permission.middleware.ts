import ChecklistItem from '../database/ChecklistItem/ChecklistItem.interface';
import Comment from '../database/Comment/Comment.interface';
import HistoryItem from '../database/HistoryItem/HistoryItem.interface';
import Project from '../database/Project/Project.interface';
import ProjectModel from '../database/Project/Project.model';
import Section from '../database/Section/Section.interface';
import Tag from '../database/Tag/Tag.interface';
import Task from '../database/Task/Task.interface';
import User from '../database/User/User.interface';
import InsufficientPermissionsException from '../exceptions/permissions/InsufficientPermissionsException';

type Entity = User | ChecklistItem | Comment | HistoryItem | Project | Section | Tag | Task;

type RequestType = 'get' | 'update' | 'create' | 'delete';

function entityIsUser(entity: Entity): entity is User {
  return Object.prototype.hasOwnProperty.call(entity, 'email');
}

async function permissionMiddleware(user: User, entity: Entity, requestType: RequestType) {
  if (entityIsUser(entity)) {
    const commonProjects = await ProjectModel.find({
      users: {
        $elemMatch: {
          $all: [user._id, entity._id],
        },
      },
    });

    if (!commonProjects) {
      throw new InsufficientPermissionsException(user, { type: 'user', _id: entity._id });
    }
  }

  return true;
}

export default permissionMiddleware;

export { permissionMiddleware };
