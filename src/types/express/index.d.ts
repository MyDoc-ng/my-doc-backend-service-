import { JwtUserPayload, JwtDoctorPayload, JwtAdminPayload } from '../../middleware/authMiddleware';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      doctor?: JwtDoctorPayload;
      admin?: JwtAdminPayload;
    }
  }
}

export {}; 