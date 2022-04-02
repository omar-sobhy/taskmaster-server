import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import { getTagData } from '../database_functions/Tag.database.functions';
import TagsNotFoundException from '../exceptions/tags/TagsNotFoundException';
import authMiddleware from '../middleware/auth.middleware';

class TagRoutes implements RouterWrapper {
  public path = '/tags';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}`, TagRoutes.getTagData);
  }

  private static async getTagData(req: Request, res: Response, next: NextFunction) {
    const { tagId } = req.query;
    if (!tagId) {
      res.json({
        tags: [],
      }).end();
      return;
    }

    const tagsOrError = await (typeof tagId === 'string'
      ? getTagData([tagId])
      : getTagData(tagId as string[]));

    if (tagsOrError.type === 'error') {
      next(new TagsNotFoundException(tagsOrError.errorData as string[]));
      return;
    }

    const tags = tagsOrError.data;

    res.json({
      tags,
    }).end();
  }
}

export default TagRoutes;
