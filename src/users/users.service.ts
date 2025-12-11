import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByLoginId(loginId: string) {
    return this.prisma.user.findUnique({
      where: { loginId },
    });
  }
}
