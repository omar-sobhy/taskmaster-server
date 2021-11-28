import HttpException from '../HttpException';

class UserNotFoundException extends HttpException {
  constructor() {
    super(500, 'Invalid username or password');
  }
}

export default UserNotFoundException;
