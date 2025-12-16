import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReadingStatus } from '@prisma/client';
import { BooksService } from '../books/books.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserBookDto } from './dto/create-user-book.dto';
import { UpdateUserBookDto } from './dto/update-user-book.dto';

@Injectable()
export class UserBooksService {
  private readonly logger = new Logger(UserBooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly booksService: BooksService,
  ) {}

  async listUserBooks(userId: string) {
    const sanitizedUserId = userId?.trim();

    if (!sanitizedUserId) {
      throw new BadRequestException('userId is required.');
    }

    return this.prisma.userBook.findMany({
      where: { userId: sanitizedUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUserBook(userId: string, payload: CreateUserBookDto) {
    const sanitizedUserId = userId?.trim();
    const externalId = payload?.externalId?.trim();
    const title = payload?.title?.trim();

    if (!sanitizedUserId) {
      throw new BadRequestException('userId is required.');
    }
    if (!externalId) {
      throw new BadRequestException('externalId is required.');
    }
    if (!title) {
      throw new BadRequestException('title is required.');
    }

    const author = payload?.author?.trim();
    const coverUrl = payload?.coverUrl?.trim();
    const status = this.normalizeStatus(payload?.status);
    const pageCount = this.validateInteger(payload?.pageCount, 'pageCount', { min: 1 });
    const currentPage = this.validateInteger(payload?.currentPage, 'currentPage', { min: 0 });
    const goalDate = this.parseDate(payload?.goalDate, 'goalDate');
    const startedAt = this.parseDate(payload?.startedAt, 'startedAt');
    const finishedAt = this.parseDate(payload?.finishedAt, 'finishedAt');
    const resolvedPageCount = pageCount ?? (await this.lookupPageCount(externalId));

    try {
      return await this.prisma.userBook.create({
        data: {
          user: {
            connect: { id: sanitizedUserId },
          },
          externalId,
          title,
          author: author ?? undefined,
          pageCount: resolvedPageCount ?? undefined,
          coverUrl: coverUrl ?? undefined,
          status,
          currentPage: currentPage ?? undefined,
          goalDate: goalDate ?? undefined,
          startedAt: startedAt ?? undefined,
          finishedAt: finishedAt ?? undefined,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Book already registered for this user.');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found.');
        }
      }
      throw error;
    }
  }

  async updateUserBook(userId: string, userBookId: string, payload: UpdateUserBookDto) {
    const sanitizedUserId = userId?.trim();
    const sanitizedBookId = userBookId?.trim();

    if (!sanitizedUserId) {
      throw new BadRequestException('userId is required.');
    }

    if (!sanitizedBookId) {
      throw new BadRequestException('userBookId is required.');
    }

    const pageCount = this.validateInteger(payload?.pageCount, 'pageCount', { min: 1 });
    const currentPage = this.validateInteger(payload?.currentPage, 'currentPage', { min: 0 });
    const goalDate = this.parseDate(payload?.goalDate, 'goalDate');

    const updateData: Prisma.UserBookUpdateInput = {};
    if (pageCount !== undefined) {
      updateData.pageCount = pageCount;
    }
    if (currentPage !== undefined) {
      updateData.currentPage = currentPage;
    }
    if (goalDate !== undefined) {
      updateData.goalDate = goalDate;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('At least one updatable field is required.');
    }

    const existing = await this.prisma.userBook.findUnique({
      where: { id: sanitizedBookId },
      select: { userId: true },
    });

    if (!existing || existing.userId !== sanitizedUserId) {
      throw new NotFoundException('User book not found.');
    }

    return this.prisma.userBook.update({
      where: { id: sanitizedBookId },
      data: updateData,
    });
  }

  private normalizeStatus(status?: ReadingStatus | string): ReadingStatus {
    if (!status) {
      return ReadingStatus.reading;
    }

    const normalized = status.toString().trim().toLowerCase() as ReadingStatus;

    if (!Object.values(ReadingStatus).includes(normalized)) {
      throw new BadRequestException(`status must be one of ${Object.values(ReadingStatus).join(', ')}.`);
    }

    return normalized;
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

  private parseDate(value: string | Date | undefined, field: string): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new BadRequestException(`${field} must be a valid date.`);
      }
      return value;
    }

    const trimmed = value.toString().trim();
    if (!trimmed) {
      throw new BadRequestException(`${field} must be a valid date string.`);
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid date string.`);
    }

    return parsed;
  }

  private async lookupPageCount(externalId: string): Promise<number | undefined> {
    if (!/^\d{13}$/.test(externalId)) {
      return undefined;
    }

    try {
      const payload = (await this.booksService.getBookByIsbn13(externalId)) as {
        item?: Array<{
          itemPage?: number | string;
          subInfo?: { itemPage?: number | string };
        }>;
      };
      const items = Array.isArray(payload.item) ? payload.item : [];
      if (items.length === 0) {
        return undefined;
      }

      const first = items[0];
      const rawPageCount = first.itemPage ?? first.subInfo?.itemPage;
      if (rawPageCount === undefined || rawPageCount === null) {
        return undefined;
      }

      const numeric = Number(rawPageCount);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return undefined;
      }

      return Math.trunc(numeric);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.warn(
          `Failed to auto-fill pageCount from Aladin for ISBN ${externalId}: ${(error as Error).message}`,
        );
      }
      return undefined;
    }
  }
}
