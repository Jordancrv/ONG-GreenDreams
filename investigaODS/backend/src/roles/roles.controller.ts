import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async listRoles() {
    return this.rolesService.findAll();
  }

  @Post()
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  async updateRole(@Param('id') id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(Number(id), dto);
  }

  @Delete(':id')
  async deleteRole(@Param('id') id: number) {
    await this.rolesService.remove(Number(id));
    return { success: true };
  }
}
