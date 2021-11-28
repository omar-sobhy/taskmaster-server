import { Request } from 'express';
import User from '../database/User/User.interface';

interface RequestWithUser extends Request {
  user: User;
}

export default RequestWithUser;
