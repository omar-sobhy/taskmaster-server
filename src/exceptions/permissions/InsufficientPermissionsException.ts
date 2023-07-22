import User from '../../database/User/User.interface';
import HttpException from '../HttpException';

class InsufficientPermissionsException extends HttpException {
  public entities;

  constructor(user: User, entities: { type: string; _id: string }[]) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _id, type } = entities[0];

    super(404, `No ${type} with id '${_id.toString()}' found`);

    this.entities = entities;
  }
}

export default InsufficientPermissionsException;
