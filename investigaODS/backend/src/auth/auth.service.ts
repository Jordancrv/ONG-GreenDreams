import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MembershipPlanCode } from '../plans/membership-plan.entity';

interface TokenBundle {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly refreshCookieName = 'refreshToken';

  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      passwordHash,
    );
    await this.subscriptionsService.ensureDefaultSubscription(user.id, MembershipPlanCode.BASIC);
    const tokens = await this.generateTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const tokens = await this.generateTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    const tokens = await this.generateTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  getRefreshCookieOptions() {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_TTL', '7d');
    const maxAgeMs = this.parseDurationMs(expiresIn);
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      maxAge: maxAgeMs,
      path: '/api/auth',
    };
  }

  stripPassword(user: User) {
    const { passwordHash, ...rest } = user as any;
    return {
      ...rest,
      role: user.roleCode,
    };
  }

  private async generateTokens(user: User): Promise<TokenBundle> {
    const payload = { sub: user.id, email: user.email, role: user.roleCode };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES', '15m'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES', '7d'),
    });
    return { accessToken, refreshToken };
  }

  private parseDurationMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhdw])$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? multipliers.d);
  }

  getRefreshCookieName() {
    return this.refreshCookieName;
  }
}
