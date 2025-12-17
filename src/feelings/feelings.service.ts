import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeelingDto } from './dto/create-feeling.dto';

@Injectable()
export class FeelingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFeelings(userId: string, userBookId: string) {
    const sanitizedUserId = userId?.trim();
    const sanitizedBookId = userBookId?.trim();

    if (!sanitizedUserId) {
      throw new BadRequestException('userId is required.');
    }

    if (!sanitizedBookId) {
      throw new BadRequestException('userBookId is required.');
    }

    const userBook = await this.prisma.userBook.findUnique({
      where: { id: sanitizedBookId },
      select: { userId: true },
    });

    if (!userBook || userBook.userId !== sanitizedUserId) {
      throw new NotFoundException('User book not found.');
    }

    return this.prisma.feeling.findMany({
      where: {
        userId: sanitizedUserId,
        userBookId: sanitizedBookId,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async createFeeling(userId: string, payload: CreateFeelingDto) {
    const sanitizedUserId = userId?.trim();
    const userBookId = payload?.userBookId?.trim();
    const text = payload?.text?.trim();

    if (!sanitizedUserId) {
      throw new BadRequestException('userId is required.');
    }

    if (!userBookId) {
      throw new BadRequestException('userBookId is required.');
    }

    if (!text) {
      throw new BadRequestException('text is required.');
    }

    const pageNumber = this.validateInteger(payload?.pageNumber, 'pageNumber', { min: 1 });

    const userBook = await this.prisma.userBook.findUnique({
      where: { id: userBookId },
      select: { userId: true },
    });

    if (!userBook || userBook.userId !== sanitizedUserId) {
      throw new NotFoundException('User book not found.');
    }

    return this.prisma.feeling.create({
      data: {
        text,
        pageNumber: pageNumber ?? null,
        user: { connect: { id: sanitizedUserId } },
        userBook: { connect: { id: userBookId } },
      },
    });
  }

  private validateInteger(
    value: number | undefined,
    field: string,
    options: { min?: number; max?: number } = {},
  ): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (!Number.isFinite(value)) {
      throw new BadRequestException(`${field} must be a finite number.`);
    }

    if (!Number.isInteger(value)) {
      throw new BadRequestException(`${field} must be an integer.`);
    }

    if (options.min !== undefined && value < options.min) {
      throw new BadRequestException(`${field} must be greater than or equal to ${options.min}.`);
    }

    if (options.max !== undefined && value > options.max) {
      throw new BadRequestException(`${field} must be less than or equal to ${options.max}.`);
    }

    return value;
  }
}
