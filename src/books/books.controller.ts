import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
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
