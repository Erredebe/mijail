import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRoutingPolicyDto } from './dto/create-routing-policy.dto';
import { UpdateRoutingPolicyDto } from './dto/update-routing-policy.dto';
import { RoutingPoliciesService } from './routing-policies.service';

@Controller('routing-policies')
export class RoutingPoliciesController {
  constructor(private readonly routingPoliciesService: RoutingPoliciesService) {}

  @Get()
  findAll() {
    return this.routingPoliciesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routingPoliciesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'builder')
  @Post()
  create(@Body() input: CreateRoutingPolicyDto) {
    return this.routingPoliciesService.create(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'builder')
  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateRoutingPolicyDto) {
    return this.routingPoliciesService.update(id, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routingPoliciesService.remove(id);
  }
}
