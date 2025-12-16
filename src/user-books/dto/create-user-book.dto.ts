import { ReadingStatus } from '@prisma/client';

export class CreateUserBookDto {
  externalId!: string;
  title!: string;
  author?: string;
  pageCount?: number;
  coverUrl?: string;
  status?: ReadingStatus | string;
  currentPage?: number;
  goalDate?: string | Date;
  startedAt?: string | Date;
  finishedAt?: string | Date;
}
