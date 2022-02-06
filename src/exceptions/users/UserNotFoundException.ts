import HttpException from '../HttpException';

class UserNotFoundException extends HttpException {
  constructor(userId: string) {
    super(404, `No user with id '${userId}' found`);
  }
}

export default UserNotFoundException;
