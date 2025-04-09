import { User, UserRole, Role } from '@prisma/client';

export type UserWithRoles = User & {
  roles: (UserRole & {
    role: Role
  })[];
};