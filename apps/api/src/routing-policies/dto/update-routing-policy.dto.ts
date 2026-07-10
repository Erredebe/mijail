import { PartialType } from '@nestjs/mapped-types';
import { CreateRoutingPolicyDto } from './create-routing-policy.dto';

export class UpdateRoutingPolicyDto extends PartialType(CreateRoutingPolicyDto) {}
