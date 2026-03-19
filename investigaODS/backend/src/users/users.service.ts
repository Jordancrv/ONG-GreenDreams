import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { Role } from '../roles/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto, passwordHash: string): Promise<User> {
    const role = await this.findRoleOrFail(createUserDto.role ?? UserRole.STUDENT);
    const user = this.usersRepository.create({
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role,
    });
    return this.usersRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email }, relations: ['role'] });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: ['role'] });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['role'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.role) {
      user.role = await this.findRoleOrFail(updateUserDto.role);
    }

    const { role, ...rest } = updateUserDto;
    Object.assign(user, rest);

    return this.usersRepository.save(user);
  }

  private async findRoleOrFail(code: UserRole): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { code } });
    if (!role) {
      throw new NotFoundException(`Role ${code} not found`);
    }
    return role;
  }
}
