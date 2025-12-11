import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginId: string) {
    const trimmed = loginId?.trim();
    if (!trimmed) {
      throw new BadRequestException('loginId is required');
    }

    const user = await this.usersService.findByLoginId(trimmed);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      loginId: user.loginId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        loginId: user.loginId,
        displayName: user.displayName,
      },
    };
  }
}
