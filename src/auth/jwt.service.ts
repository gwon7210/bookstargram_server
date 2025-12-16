import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_EXP_SECONDS = 60 * 60 * 24; // 24h

@Injectable()
export class JwtService {
  private readonly secret = process.env.JWT_SECRET || 'change-me';
  private readonly expiresInSeconds = Number(process.env.JWT_EXPIRES_IN ?? DEFAULT_EXP_SECONDS);

  sign(payload: Record<string, unknown>): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const exp = issuedAt + this.expiresInSeconds;

    const header = { alg: 'HS256', typ: 'JWT' };
    const fullPayload = { ...payload, iat: issuedAt, exp };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', this.secret).update(data).digest('base64url');

    return `${data}.${signature}`;
  }

  verify<TPayload extends Record<string, unknown> = Record<string, unknown>>(token: string): TPayload {
    if (!token) {
      throw new UnauthorizedException('Missing token.');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format.');
    }

    const [encodedHeader, encodedPayload, receivedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', this.secret).update(data).digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(receivedSignature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Invalid token signature.');
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');

    let payload: TPayload & { exp?: number };
    try {
      payload = JSON.parse(payloadJson);
    } catch (error) {
      throw new UnauthorizedException('Invalid token payload.', { cause: error as Error });
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) {
      throw new UnauthorizedException('Token expired.');
    }

    return payload;
  }

  private base64UrlEncode(input: string): string {
    return Buffer.from(input).toString('base64url');
  }
}
