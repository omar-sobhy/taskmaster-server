import HttpException from '../HttpException';

class UserAlreadyExistsException extends HttpException {
  constructor(username: string) {
    super(409, `A user with username '${username}' already exists`);
  }
}

export default UserAlreadyExistsException;
