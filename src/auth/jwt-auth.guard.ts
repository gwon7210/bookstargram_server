import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from './jwt.service';

interface AuthenticatedUser {
  id: string;
  loginId?: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    const payload = this.jwtService.verify(token);

    const userId = payload?.sub;
    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('Invalid token payload.');
    }

    request.user = {
      id: userId,
      loginId: typeof payload.loginId === 'string' ? payload.loginId : undefined,
    };

    return true;
  }

  private extractToken(request: Request): string {
    const header = request.headers['authorization'];
    if (!header || typeof header !== 'string') {
      throw new UnauthorizedException('Missing Authorization header.');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must use the Bearer scheme.');
    }

    return token;
  }
}
