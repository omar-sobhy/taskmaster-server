import HttpException from '../HttpException';

class MissingAuthenticationTokenException extends HttpException {
  constructor() {
    super(500, 'Missing authentication token');
  }
}

export default MissingAuthenticationTokenException;
