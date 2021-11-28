import {
  NextFunction, Request, Response, Router,
} from 'express';
import Controller from '../controllers/Controller.interface';
import * as UserController from '../controllers/User.controllers';
import CreateUserDto from '../dtos/Users/CreateUser.dto';
import LoginDto from '../dtos/Users/Login.dto';
import NotAuthorisedException from '../exceptions/auth/NotAuthorizedException';
import UserAlreadyExistsException from '../exceptions/users/UserAlreadyExistsException';
import UserNotFoundException from '../exceptions/users/UserNotFoundException';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';
import AuthenticationService from '../services/Authentication.service';

class UserRoutes implements Controller {
  public path = '/users';

  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), UserRoutes.login);
    this.router.post(`${this.path}/signup`, validationMiddleware(CreateUserDto), UserRoutes.signUp);
    this.router.get(`${this.path}/:userId/projects`, UserRoutes.projects);

    this.router.all(`${this.path}/*`, authMiddleware);
  }

  private static login(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;
    UserController.login(username, password).then(async (user) => {
      if (user === null) {
        next(new UserNotFoundException());
      } else {
        const tokenData = await AuthenticationService.createToken(user);

        res.cookie('Authorization', tokenData.token);

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
        const tokenData = await AuthenticationService.createToken(req.body);

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
}

export default UserRoutes;
