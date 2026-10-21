import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePartnerDto } from './create-partner.dto';

export class UpdatePartnerDto extends PartialType(OmitType(CreatePartnerDto, ['userId'] as const)) {}
