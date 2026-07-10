import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoutingPoliciesController } from './routing-policies.controller';
import { RoutingPoliciesService } from './routing-policies.service';

@Module({
  imports: [AuthModule],
  controllers: [RoutingPoliciesController],
  providers: [RoutingPoliciesService],
  exports: [RoutingPoliciesService],
})
export class RoutingPoliciesModule {}
