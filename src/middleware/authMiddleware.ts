import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UnauthorizedException } from "../exception/unauthorized";
import { ErrorCode } from "../exception/base";
import { log } from "console";

interface AuthenticatedRequest extends Request {
  user?: JwtPayload | string; // Extend the request object to include a `user` property
}

const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization!;

  // const token = authHeader?.split(" ")[1]; // Extract the token

  if (!token) {
    next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
        next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
      }

      req.user = user;
      next();
    });
  } catch (error) {
    next(new UnauthorizedException("unauthorized", ErrorCode.UNAUTHORIZED));
  }
};

export default authenticate;
