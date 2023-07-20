import { ObjectId } from 'mongoose';
import User from '../../database/User/User.interface';
import HttpException from '../HttpException';

class InsufficientPermissionsException extends HttpException {
  constructor(user: User, entity: { type: string; _id: ObjectId }) {
    super(401, `${user._id} tried to access entity ${entity._id} without permission`);
  }
}

export default InsufficientPermissionsException;
