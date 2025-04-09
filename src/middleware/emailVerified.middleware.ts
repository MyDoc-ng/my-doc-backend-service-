import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '../exception/unauthorized';
import { ErrorCode } from '../exception/base';
import { prisma } from '../prisma/prisma';
import { NotFoundException } from '../exception/not-found';
import logger from '../logger';

export const emailVerified = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const userId = req.user?.id;

        logger.info('User ID:', req.user);

        if (!userId) {
            throw new UnauthorizedException('Unauthorized - No user ID found', ErrorCode.UNAUTHORIZED);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailVerified: true,
            }
        });

        if (!user) {
            throw new NotFoundException('User not found', ErrorCode.NOTFOUND);
        }

        const isVerified = user.emailVerified === true;

        if (!isVerified) {
            throw new UnauthorizedException('Email verification required', ErrorCode.FORBIDDEN);
        }

        next();
    } catch (error) {
        next(error);
    }
};