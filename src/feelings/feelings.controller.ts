import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFeelingDto } from './dto/create-feeling.dto';
import { FeelingsService } from './feelings.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    loginId?: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('feelings')
export class FeelingsController {
  constructor(private readonly feelingsService: FeelingsService) {}

  @Get(':userBookId')
  list(@Req() request: AuthenticatedRequest, @Param('userBookId') userBookId: string) {
    return this.feelingsService.listFeelings(request.user.id, userBookId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateFeelingDto) {
    return this.feelingsService.createFeeling(request.user.id, body);
  }
}
