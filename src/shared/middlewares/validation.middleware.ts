// src/shared/middlewares/validation.middleware.ts - Düzeltilmiş versiyon
import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { ResponseUtil } from '@/shared/utils/response.util';

export const validationMiddleware = <T extends object>(
  dtoClass: ClassConstructor<T>,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Transform plain object to class instance
      const dto = plainToInstance(dtoClass, req[source], {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      });

      // Validate the DTO
      const errors: ValidationError[] = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
        forbidUnknownValues: true,
      });

      if (errors.length > 0) {
        const formattedErrors = errors.map((error: ValidationError) => ({
          property: error.property,
          value: error.value,
          constraints: error.constraints,
          children: error.children?.map(child => ({
            property: child.property,
            value: child.value,
            constraints: child.constraints,
          })),
        }));

        return ResponseUtil.error(
          res,
          'Validation failed',
          formattedErrors,
          400,
        );
      }

      // Set the validated and transformed DTO back to request
      req[source] = dto;
      next();
    } catch (error) {
      next(error);
    }
  };
};