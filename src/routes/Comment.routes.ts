import {
  Router, Request, Response, NextFunction,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import { getComments } from '../database_functions/Comment.database.functions';
import CommentsNotFoundException from '../exceptions/comments/CommentsNotFoundException';
import authMiddleware from '../middleware/auth.middleware';

class CommentRoutes implements RouterWrapper {
  public path = '/comments';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}`, CommentRoutes.getComments);
  }

  private static async getComments(req: Request, res: Response, next: NextFunction) {
    const { commentId } = req.query;

    if (!commentId) {
      res.json({
        comments: [],
      }).end();
      return;
    }

    const commentsOrError = await (typeof commentId === 'string'
      ? getComments([commentId])
      : getComments(commentId as string[]));

    if (commentsOrError.type === 'error') {
      next(new CommentsNotFoundException(commentsOrError.errorData as string[]));
      return;
    }

    const comments = commentsOrError.data;

    res.json({
      comments,
    }).end();
  }
}

export default CommentRoutes;
