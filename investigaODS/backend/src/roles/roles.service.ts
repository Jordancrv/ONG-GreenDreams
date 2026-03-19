import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { User } from '../users/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({ order: { code: 'ASC' } });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.rolesRepository.findOne({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Role with code ${code} already exists`);
    }

    const role = this.rolesRepository.create({
      code,
      name: dto.name.trim(),
    });

    return this.rolesRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (dto.code) {
      const normalized = dto.code.trim().toUpperCase();
      const exists = await this.rolesRepository.findOne({ where: { code: normalized } });
      if (exists && exists.id !== role.id) {
        throw new BadRequestException(`Role with code ${normalized} already exists`);
      }
      role.code = normalized;
    }

    if (dto.name !== undefined) {
      role.name = dto.name.trim();
    }

    return this.rolesRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const assignedUsers = await this.usersRepository.count({ where: { role: { id: role.id } } });
    if (assignedUsers > 0) {
      throw new BadRequestException('Cannot delete role assigned to users');
    }

    await this.rolesRepository.remove(role);
  }
}
