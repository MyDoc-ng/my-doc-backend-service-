import { IRole } from '../models/auth.model';
import { UserRole, Role } from '@prisma/client';

/**
 * Transforms user roles into a standardized format
 */


export function transformUserRoles(
    roles?: (UserRole & { role: Pick<Role, 'name'> })[]
  ): IRole[] {
    return roles?.map((userRole) => ({
      name: userRole.role.name,
    })) || [];
  }
  