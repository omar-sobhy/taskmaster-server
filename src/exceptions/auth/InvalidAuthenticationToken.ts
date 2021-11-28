import HttpException from '../HttpException';

class InvalidAuthenticationTokenException extends HttpException {
  constructor() {
    super(500, 'Invalid authentication token');
  }
}

export default InvalidAuthenticationTokenException;
