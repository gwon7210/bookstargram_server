import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BooksModule } from '../books/books.module';
import { UserBooksController } from './user-books.controller';
import { UserBooksService } from './user-books.service';

@Module({
  imports: [AuthModule, BooksModule],
  controllers: [UserBooksController],
  providers: [UserBooksService],
})
export class UserBooksModule {}
