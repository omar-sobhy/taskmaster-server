import HttpException from '../HttpException';

class InvalidUsernameOrPassword extends HttpException {
  constructor() {
    super(500, 'Invalid username or password');
  }
}

export default InvalidUsernameOrPassword;
