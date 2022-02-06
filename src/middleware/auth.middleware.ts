import { NextFunction, Response, Request } from 'express';

import * as jwt from 'jsonwebtoken';
import UserModel from '../database/User/User.model';
import InvalidAuthenticationTokenException from '../exceptions/auth/InvalidAuthenticationToken';
import MissingAuthenticationTokenException from '../exceptions/auth/MissingAuthenticationTokenException';
import DataInJwtToken from '../interfaces/DataInJwtToken.interface';

async function authMiddleware(
  request: Request,
  _: Response,
  next: NextFunction,
) {
  const { cookies } = request;
  if (!cookies || !cookies.Authorization) {
    next(new MissingAuthenticationTokenException());
  } else {
    const secret = process.env.JWT_SECRET;

    try {
      const verificationResponse = jwt
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .verify(cookies.Authorization, secret!) as DataInJwtToken;

      const user = await UserModel.findById(verificationResponse.id);

      if (!user) {
        next(new InvalidAuthenticationTokenException());
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        request.user = user;
        next();
      }
    } catch (error) {
      next(new InvalidAuthenticationTokenException());
    }
  }
}

export default authMiddleware;
