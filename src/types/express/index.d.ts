import { JwtUserPayload } from '../../middleware/authMiddleware';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export {}; 