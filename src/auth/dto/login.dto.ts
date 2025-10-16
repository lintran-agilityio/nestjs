import { PartialType } from '@nestjs/mapped-types';
import { RegisterRequestDto } from './register.dto';

export class UpdateAuthDto extends PartialType(RegisterRequestDto) {}
