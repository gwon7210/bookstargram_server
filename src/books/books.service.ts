import { BadGatewayException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BookSearchItem {
  title: string;
  link: string;
  image: string;
  author: string;
  discount: string;
  publisher: string;
  pubdate: string;
  isbn: string;
  description: string;
}

export interface BookSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: BookSearchItem[];
}

export interface SearchBooksParams {
  query: string;
  start?: number;
  display?: number;
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);
  private readonly endpoint = 'https://openapi.naver.com/v1/search/book.json';

  constructor(private readonly configService: ConfigService) {}

  async searchBooks(params: SearchBooksParams): Promise<BookSearchResponse> {
    const credentials = this.getCredentials();
    const url = new URL(this.endpoint);
    url.searchParams.set('query', params.query);

    if (params.start !== undefined) {
      url.searchParams.set('start', params.start.toString());
    }

    if (params.display !== undefined) {
      url.searchParams.set('display', params.display.toString());
    }

    let response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          'X-Naver-Client-Id': credentials.clientId,
          'X-Naver-Client-Secret': credentials.clientSecret,
        },
      });
    } catch (error) {
      this.logger.error('Failed to reach Naver open API', error as Error);
      throw new BadGatewayException('Naver book search API is not reachable right now.');
    }

    const rawBody = await response.text();

    if (!response.ok) {
      this.logger.warn(`Naver API responded with ${response.status}: ${rawBody}`);
      throw new BadGatewayException('Failed to fetch book data from Naver open API.');
    }

    try {
      return JSON.parse(rawBody) as BookSearchResponse;
    } catch (error) {
      this.logger.error('Failed to parse Naver API response', error as Error);
      throw new BadGatewayException('Naver API responded with an unexpected payload.');
    }
  }

  private getCredentials(): { clientId: string; clientSecret: string } {
    try {
      const clientId = this.configService.getOrThrow<string>('NAVER_CLIENT_ID');
      const clientSecret = this.configService.getOrThrow<string>('NAVER_CLIENT_SECRET');
      return { clientId, clientSecret };
    } catch (error) {
      this.logger.error('Naver API credentials are not configured in the environment variables.', error as Error);
      throw new InternalServerErrorException('Naver API credentials are not configured.');
    }
  }
}
