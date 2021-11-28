import * as jwt from 'jsonwebtoken';
import User from '../database/User/User.interface';
import DataInJwtToken from '../interfaces/DataInJwtToken.interface';

interface TokenData {
  expiresIn: number
  token: string
}

class AuthenticationService {
  public static createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Path='/'; Max-Age=${tokenData.expiresIn}`;
  }

  public static createToken(user: User): TokenData {
    const expiresIn = 60 * 60 * 24 * 365;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const secret = process.env.JWT_SECRET!;
    const dataStoredInToken: DataInJwtToken = {
      // eslint-disable-next-line no-underscore-dangle
      id: user._id.toString(),
    };

    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }
}

export default AuthenticationService;
