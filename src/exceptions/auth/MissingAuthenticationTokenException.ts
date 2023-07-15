import HttpException from '../HttpException';

class MissingAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, 'Missing authentication token');
  }
}

export default MissingAuthenticationTokenException;
