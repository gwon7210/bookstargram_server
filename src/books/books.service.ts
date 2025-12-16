import { BadGatewayException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SearchBooksParams {
  query: string;
  start?: number;
  display?: number;
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);
  private readonly endpoint = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
  private readonly lookupEndpoint = 'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx';

  constructor(private readonly configService: ConfigService) {}

  async searchBooks(params: SearchBooksParams): Promise<unknown> {
    const apiKey = this.getApiKey();
    const url = new URL(this.endpoint);
    url.searchParams.set('ttbkey', apiKey);
    url.searchParams.set('Query', params.query);
    url.searchParams.set('QueryType', 'Keyword');
    url.searchParams.set('SearchTarget', 'Book');
    url.searchParams.set('output', 'js');
    url.searchParams.set('Version', '20131101');

    const start = params.start ?? 1;
    const display = params.display ?? 10;
    url.searchParams.set('start', start.toString());
    url.searchParams.set('MaxResults', display.toString());

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      this.logger.error('Failed to reach Aladin ItemSearch API', error as Error);
      throw new BadGatewayException('Aladin book search API is not reachable right now.');
    }

    const rawBody = await response.text();

    if (!response.ok) {
      this.logger.warn(`Aladin API responded with ${response.status}: ${rawBody}`);
      throw new BadGatewayException('Failed to fetch book data from Aladin open API.');
    }

    try {
      return JSON.parse(rawBody);
    } catch (error) {
      this.logger.error('Failed to parse Aladin API response', error as Error);
      throw new BadGatewayException('Aladin API responded with an unexpected payload.');
    }
  }

  async getBookByIsbn13(isbn13: string): Promise<unknown> {
    const apiKey = this.getApiKey();
    const url = new URL(this.lookupEndpoint);
    url.searchParams.set('ttbkey', apiKey);
    url.searchParams.set('ItemIdType', 'ISBN13');
    url.searchParams.set('ItemId', isbn13);
    url.searchParams.set('output', 'js');
    url.searchParams.set('Version', '20131101');

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      this.logger.error('Failed to reach Aladin ItemLookUp API', error as Error);
      throw new BadGatewayException('Aladin book lookup API is not reachable right now.');
    }

    const rawBody = await response.text();

    if (!response.ok) {
      this.logger.warn(`Aladin ItemLookUp API responded with ${response.status}: ${rawBody}`);
      throw new BadGatewayException('Failed to fetch book data from Aladin open API.');
    }

    let parsed: { item?: unknown };
    try {
      parsed = JSON.parse(rawBody) as { item?: unknown };
    } catch (error) {
      this.logger.error('Failed to parse Aladin ItemLookUp API response', error as Error);
      throw new BadGatewayException('Aladin API responded with an unexpected payload.');
    }

    const items = Array.isArray(parsed.item) ? parsed.item : [];
    if (items.length === 0) {
      throw new NotFoundException('도서를 찾을 수 없습니다');
    }

    return parsed;
  }

  private getApiKey(): string {
    try {
      return this.configService.getOrThrow<string>('ALADIN_API_KEY');
    } catch (error) {
      this.logger.error('Aladin API key is not configured in the environment variables.', error as Error);
      throw new InternalServerErrorException('Aladin API key is not configured.');
    }
  }
}
