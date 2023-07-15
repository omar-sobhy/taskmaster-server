import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import * as UserController from '../controllers/User.controllers';
import { getByIds } from '../controllers/User.controllers';
import CreateUserDto from '../dtos/Users/CreateUser.dto';
import GetUsersDto from '../dtos/Users/GetUsers.dto';
import LoginDto from '../dtos/Users/Login.dto';
import NotAuthorisedException from '../exceptions/auth/NotAuthorizedException';
import HttpException from '../exceptions/HttpException';
import UserAlreadyExistsException from '../exceptions/users/UserAlreadyExistsException';
import InvalidUsernameOrPassword from '../exceptions/users/InvalidUsernameOrPasswordException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';
import AuthenticationService from '../services/Authentication.service';

class UserRoutes implements RouterWrapper {
  public path = '/users';

  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validationMiddleware(GetUsersDto), UserRoutes.getUserData);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), UserRoutes.login);
    this.router.post(`${this.path}/signup`, validationMiddleware(CreateUserDto), UserRoutes.signUp);
    this.router.get(`${this.path}/:userId/projects`, UserRoutes.projects);

    this.router.all(`${this.path}/*`, authMiddleware);
  }

  private static login(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;
    UserController.login(username, password).then(async (user) => {
      if (user === null) {
        next(new InvalidUsernameOrPassword());
      } else {
        const tokenData = await AuthenticationService.createToken(user);

        res.cookie('Authorization', tokenData.token, {
          sameSite: 'none',
          // secure: true,
          path: '/',
        });

        res.json({
          user: {
            username: user.username,
            email: user.email,
          },
        });
        res.end();
      }
    });
  }

  private static signUp(req: Request, res: Response, next: NextFunction) {
    const { username, password, email } = req.body;
    UserController.signUp(username, password, email).then(async (user) => {
      if (user === null) {
        next(new UserAlreadyExistsException(username));
      } else {
        const tokenData = await AuthenticationService.createToken(user);

        res.cookie('Authorization', tokenData.token);

        res.json({
          user: {
            username: user.username,
            email: user.email,
          },
        });
      }

      res.end();
    });
  }

  private static projects(req: Request, res: Response, next: NextFunction) {
    const { _id: id } = (req as RequestWithUser).user;
    const requestParamId = req.params.projectId;
    if (requestParamId !== id.toString()) {
      next(new NotAuthorisedException());
    } else {
      UserController.getProjects(id.toString()).then((projects) => {
        res.json({ projects });
      });
    }
  }

  private static async getUserData(req: Request, res: Response, next: NextFunction) {
    const { userIds } = req.body;

    const usersOrErrors = await getByIds(userIds);
    if (usersOrErrors.length === 0) {
      res
        .json({
          users: [],
        })
        .end();
    } else if (typeof usersOrErrors[0] === 'string') {
      const message = usersOrErrors.map((id) => `No user with id '${id}' found.`).join('\n');

      next(new HttpException(404, message));
    } else {
      res
        .json({
          users: usersOrErrors,
        })
        .end();
    }
  }
}

export default UserRoutes;
