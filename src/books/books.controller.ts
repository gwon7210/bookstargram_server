import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('search')
  searchBooks(
    @Query('query') query?: string,
    @Query('start') start?: string,
    @Query('display') display?: string,
  ) {
    const normalizedQuery = query?.trim();

    if (!normalizedQuery) {
      throw new BadRequestException('query is a required search parameter.');
    }

    const parsedStart = this.parsePositiveInt(start, 'start');
    const parsedDisplay = this.parsePositiveInt(display, 'display');

    return this.booksService.searchBooks({
      query: normalizedQuery,
      start: parsedStart,
      display: parsedDisplay,
    });
  }

  @Get(':isbn13')
  getBookByIsbn13(@Param('isbn13') isbn13: string) {
    const normalized = isbn13?.trim();
    if (!normalized) {
      throw new BadRequestException('isbn13 is required.');
    }

    if (!/^\d{13}$/.test(normalized)) {
      throw new BadRequestException('isbn13 must be a 13-digit numeric string.');
    }

    return this.booksService.getBookByIsbn13(normalized);
  }

  private parsePositiveInt(value: string | undefined, field: string): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`${field} must be a positive integer.`);
    }

    return parsed;
  }
}
