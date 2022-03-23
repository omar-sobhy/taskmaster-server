import HttpException from '../HttpException';

class InvalidUsernameOrPassword extends HttpException {
  constructor() {
    super(401, 'Invalid username or password');
  }
}

export default InvalidUsernameOrPassword;
