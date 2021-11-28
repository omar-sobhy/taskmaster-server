import HttpException from '../HttpException';

class UserAlreadyExistsException extends HttpException {
  constructor(username: string) {
    super(500, `A user with username '${username}' already exists`);
  }
}

export default UserAlreadyExistsException;
