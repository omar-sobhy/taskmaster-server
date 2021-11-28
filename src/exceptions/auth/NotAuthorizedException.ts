import HttpException from '../HttpException';

class NotAuthorisedException extends HttpException {
  constructor() {
    super(500, 'Not authorised');
  }
}

export default NotAuthorisedException;
