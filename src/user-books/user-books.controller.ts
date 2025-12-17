import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserBookDto } from './dto/create-user-book.dto';
import { UpdateUserBookDto } from './dto/update-user-book.dto';
import { UserBooksService } from './user-books.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    loginId?: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('user-books')
export class UserBooksController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Get()
  findMine(@Req() request: AuthenticatedRequest) {
    return this.userBooksService.listUserBooks(request.user.id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateUserBookDto) {
    return this.userBooksService.createUserBook(request.user.id, body);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateUserBookDto,
  ) {
    return this.userBooksService.updateUserBook(request.user.id, id, body);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.userBooksService.deleteUserBook(request.user.id, id);
  }
}
