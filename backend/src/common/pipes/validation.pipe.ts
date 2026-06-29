import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: false,
      stopAtFirstError: false,
      validationError: {
        target: false,
        value: false,
      },
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): string[] {
    const formattedErrors: string[] = [];

    const flattenErrors = (errorList: any[]) => {
      for (const error of errorList) {
        if (error.constraints) {
          const constraintMessages = Object.values(error.constraints);
          formattedErrors.push(...constraintMessages.map(String));
        }
        if (error.children && error.children.length > 0) {
          flattenErrors(error.children);
        }
      }
    };

    flattenErrors(errors);
    return formattedErrors;
  }
}
