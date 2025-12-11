import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

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

  private base64UrlEncode(input: string): string {
    return Buffer.from(input).toString('base64url');
  }
}
