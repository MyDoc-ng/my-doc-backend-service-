// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { UserRoutes } from './routes/user.routes';
import { HealthcareProviderRoutes } from './routes/healthcareProvider.routes';
import { WalletRoutes } from './routes/wallet.routes';
import { AppointmentRoutes } from './routes/appointment.routes';
import { MedicalHistoryRoutes } from './routes/medicalHistory.routes';
import { AuthRoutes } from './routes/auth.routes';
import { ZodError } from 'zod';
import { NotFoundError } from './errors/notFoundError';
import { config } from 'dotenv';

config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/auth', AuthRoutes.router);
app.use('/api/users', UserRoutes.router);
app.use('/api/providers', HealthcareProviderRoutes.router);
app.use('/api/wallets', WalletRoutes.router);
app.use('/api/appointments', AppointmentRoutes.router);
app.use('/api/medical-histories', MedicalHistoryRoutes.router);

// Not Found Handler
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError('Route Not Found'));
});

// Error Handler - Keep this as the last middleware
app.use(errorHandler);


export { app };


// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { CustomError } from '../errors/customError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);  // Log the error for debugging purposes

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.errors,
    });
  }

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.serializeErrors(),
    });
  }

  // Generic server error
  return res.status(500).json({
    message: 'Internal Server Error',
    errors: [{ message: 'Something went wrong.' }],
  });
};


// src/errors/customError.ts
export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}

// src/errors/badRequestError.ts

import { CustomError } from './customError';

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(public message: string) {
    super(message);

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}


// src/errors/notFoundError.ts
import { CustomError } from './customError';

export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(public message: string) {
    super(message);

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}



// src/utils/asyncHandler.ts  (Optional, but can help reduce boilerplate)
import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};



// src/prisma.ts (Singleton for Prisma Client)
import { PrismaClient } from '@prisma/client';

// Use a singleton to prevent creating multiple Prisma clients during development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };


// src/server.ts
import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});



// src/validations/user.validations.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  insuranceProvider: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;


// src/services/user.service.ts
import { prisma } from '../prisma';
import { CreateUserInput, UpdateUserInput } from '../validations/user.validations';
import bcrypt from 'bcrypt';
import { BadRequestError } from '../errors/badRequestError';
import { NotFoundError } from '../errors/notFoundError';

class UserService {
  async createUser(input: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          ...input,
          password: hashedPassword,
          wallet: {
            create: {} // Create an empty wallet on user creation
          }
        },
      });
      return user;
    } catch (error:any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new BadRequestError('Email already exists.');
      } else if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
        throw new BadRequestError('Phone number already exists.');
      }
      throw error; // Re-throw any other errors
    }
  }

  async getAllUsers() {
    return prisma.user.findMany();
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateUser(id: string, input: UpdateUserInput) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: input,
      });
      return user;
    } catch (error: any) {
       if (error.code === 'P2025') {
          throw new NotFoundError('User not found');
       }
       throw error;
    }

  }

  async deleteUser(id: string) {
    try {
      await prisma.user.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      throw error;
    }

  }
}

export const userService = new UserService();


// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { createUserSchema, update
UserSchema } from '../validations/user.validations';
import { asyncHandler } from '../utils/asyncHandler';

class UserController {
  async createUser(req: Request, res: Response, next: NextFunction) {
    const validatedData = createUserSchema.parse(req.body);
    const user = await userService.createUser(validatedData);
    res.status(201).json(user);
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    const users = await userService.getAllUsers();
    res.json(users);
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.json(user);
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(id, validatedData);
    res.json(user);
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(204).send();  // No content
  }
}

export const userController = new UserController();

// src/routes/user.routes.ts
import express from 'express';
import { userController } from '../controllers/user.controller';
import { asyncHandler } from '../utils/asyncHandler'; // Import asyncHandler

class UserRoutes {
  router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', asyncHandler(userController.createUser.bind(userController))); // Use asyncHandler
    this.router.get('/', asyncHandler(userController.getAllUsers.bind(userController))); // Use asyncHandler
    this.router.get('/:id', asyncHandler(userController.getUserById.bind(userController))); // Use asyncHandler
    this.router.put('/:id', asyncHandler(userController.updateUser.bind(userController))); // Use asyncHandler
    this.router.delete('/:id', asyncHandler(userController.deleteUser.bind(userController))); // Use asyncHandler
  }
}

export const UserRoutes = new UserRoutes();


// --- Example of another entity. Repeat this pattern for others ---

// src/validations/healthcareProvider.validations.ts
import { z } from 'zod';

export const createHealthcareProviderSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  experienceYears: z.number().optional(),
  rating: z.number().optional(),
  consultationFee: z.number().optional(),
  homeVisitCharge: z.number().optional(),
  availability: z.string().optional(), // JSON string representing schedule
  certifications: z.string().optional(), // JSON string representing list of certifications
  availableForUrgent: z.boolean().optional(),
  acceptedConsultationTypes: z.array(z.enum(['CHAT', 'VIDEO', 'AUDIO', 'IN_PERSON', 'HOME_VISIT'])).optional()
});

export const updateHealthcareProviderSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  experienceYears: z.number().optional(),
  rating: z.number().optional(),
  consultationFee: z.number().optional(),
  homeVisitCharge: z.number().optional(),
  availability: z.string().optional(), // JSON string representing schedule
  certifications: z.string().optional(), // JSON string representing list of certifications
  availableForUrgent: z.boolean().optional(),
  acceptedConsultationTypes: z.array(z.enum(['CHAT', 'VIDEO', 'AUDIO', 'IN_PERSON', 'HOME_VISIT'])).optional()
});


export type CreateHealthcareProviderInput = z.infer<typeof createHealthcareProviderSchema>;
export type UpdateHealthcareProviderInput = z.infer<typeof updateHealthcareProviderSchema>;


// src/services/healthcareProvider.service.ts
import { prisma } from '../prisma';
import { CreateHealthcareProviderInput, UpdateHealthcareProviderInput } from '../validations/healthcareProvider.validations';
import { NotFoundError } from '../errors/notFoundError';

class HealthcareProviderService {
  async createHealthcareProvider(input: CreateHealthcareProviderInput) {
    return prisma.healthcareProvider.create({ data: input });
  }

  async getAllHealthcareProviders() {
    return prisma.healthcareProvider.findMany();
  }

  async getHealthcareProviderById(id: string) {
    const provider = await prisma.healthcareProvider.findUnique({ where: { id } });
    if (!provider) {
      throw new NotFoundError('HealthcareProvider not found');
    }
    return provider;
  }

  async updateHealthcareProvider(id: string, input: UpdateHealthcareProviderInput) {
    try {
        const provider = await prisma.healthcareProvider.update({
            where: { id },
            data: input,
        });
        return provider;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new NotFoundError('HealthcareProvider not found');
        }
        throw error;
    }

  }

  async deleteHealthcareProvider(id: string) {
    try {
        await prisma.healthcareProvider.delete({ where: { id } });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new NotFoundError('HealthcareProvider not found');
        }
        throw error;
    }
  }
}

export const healthcareProviderService = new HealthcareProviderService();



// src/controllers/healthcareProvider.controller.ts
import { Request, Response, NextFunction } from 'express';
import { healthcareProviderService } from '../services/healthcareProvider.service';
import { createHealthcareProviderSchema, updateHealthcareProviderSchema } from '../validations/healthcareProvider.validations';
import { asyncHandler } from '../utils/asyncHandler';

class HealthcareProviderController {
  async createHealthcareProvider(req: Request, res: Response, next: NextFunction) {
    const validatedData = createHealthcareProviderSchema.parse(req.body);
    const provider = await healthcareProviderService.createHealthcareProvider(validatedData);
    res.status(201).json(provider);
  }

  async getAllHealthcareProviders(req: Request, res: Response, next: NextFunction) {
    const providers = await healthcareProviderService.getAllHealthcareProviders();
    res.json(providers);
  }

  async getHealthcareProviderById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const provider = await healthcareProviderService.getHealthcareProviderById(id);
    res.json(provider);
  }

  async updateHealthcareProvider(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const validatedData = updateHealthcareProviderSchema.parse(req.body);
    const provider = await healthcareProviderService.updateHealthcareProvider(id, validatedData);
    res.json(provider);
  }

  async deleteHealthcareProvider(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    await healthcareProviderService.deleteHealthcareProvider(id);
    res.status(204).send();  // No content
  }
}

export const healthcareProviderController = new HealthcareProviderController();


// src/routes/healthcareProvider.routes.ts
import express from 'express';
import { healthcareProviderController } from '../controllers/healthcareProvider.controller';
import { asyncHandler } from '../utils/asyncHandler';

class HealthcareProviderRoutes {
  router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', asyncHandler(healthcareProviderController.createHealthcareProvider.bind(healthcareProviderController)));
    this.router.get('/', asyncHandler(healthcareProviderController.getAllHealthcareProviders.bind(healthcareProviderController)));
    this.router.get('/:id', asyncHandler(healthcareProviderController.getHealthcareProviderById.bind(healthcareProviderController)));
    this.router.put('/:id', asyncHandler(healthcareProviderController.updateHealthcareProvider.bind(healthcareProviderController)));
    this.router.delete('/:id', asyncHandler(healthcareProviderController.deleteHealthcareProvider.bind(healthcareProviderController)));
  }
}

export const HealthcareProviderRoutes = new HealthcareProviderRoutes();

// --- Add similar files for other models (Wallet, Appointment, MedicalHistory, etc.) ---

// Wallet Routes, Controller, Service, and Validations

// src/validations/wallet.validations.ts
import { z } from 'zod';

export const createWalletSchema = z.object({
    userId: z.string().uuid(),  // Validates that the userId is a UUID
    balance: z.number().optional().default(0), // Optional with a default value
});

export const updateWalletSchema = z.object({
    balance: z.number().optional(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;


// src/services/wallet.service.ts
import { prisma } from '../prisma';
import { CreateWalletInput, UpdateWalletInput } from '../validations/wallet.validations';
import { NotFoundError } from '../errors/notFoundError';
import { BadRequestError } from '../errors/badRequestError';

class WalletService {
    async createWallet(input: CreateWalletInput) {
        try {
            const wallet = await prisma.wallet.create({
                data: input,
            });
            return wallet;
        } catch (error: any) {
            if (error.code === 'P2002' && error.meta?.target?.includes('userId')) {
                throw new BadRequestError('Wallet already exists for this user.');
            }
            throw error; // Re-throw any other errors
        }
    }

    async getWalletById(id: string) {
        const wallet = await prisma.wallet.findUnique({ where: { id } });
        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }
        return wallet;
    }

    async updateWallet(id: string, input: UpdateWalletInput) {
        try {
            const wallet = await prisma.wallet.update({
                where: { id },
                data: input,
            });
            return wallet;
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new NotFoundError('Wallet not found');
            }
            throw error;
        }
    }

    // Add methods to fund and withdraw from wallet with transaction recording
    async fundWallet(walletId: string, amount: number, description?: string) {
      if (amount <= 0) {
        throw new BadRequestError('Amount must be greater than zero.');
      }
      return prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amount },
          transactions: {
            create: {
              amount: amount,
              type: 'DEPOSIT',
              description: description || 'Wallet funding',
            },
          },
        },
        include: { transactions: true }
      });
    }

    async withdrawFromWallet(walletId: string, amount: number, description?: string) {
      if (amount <= 0) {
        throw new BadRequestError('Amount must be greater than zero.');
      }

      const wallet = await this.getWalletById(walletId);

      if (wallet.balance < amount) {
        throw new BadRequestError('Insufficient funds.');
      }

      return prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: amount },
          transactions: {
            create: {
              amount: -amount, // Negative amount for withdrawal
              type: 'WITHDRAWAL',
              description: description || 'Wallet withdrawal',
            },
          },
        },
        include: { transactions: true }
      });
    }

    async getWalletTransactions(walletId: string) {
        const wallet = await this.getWalletById(walletId);
        return prisma.transaction.findMany({
            where: { walletId: walletId },
            orderBy: { timestamp: 'desc' } // Order by timestamp for recency
        });
    }
}

export const walletService = new WalletService();


// src/controllers/wallet.controller.ts
import { Request, Response, NextFunction } from 'express';
import { walletService } from '../services/wallet.service';
import { createWalletSchema, updateWalletSchema } from '../validations/wallet.validations';
import { asyncHandler } from '../utils/asyncHandler';

class WalletController {
    async createWallet(req: Request, res: Response, next: NextFunction) {
        const validatedData = createWalletSchema