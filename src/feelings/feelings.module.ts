import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeelingsController } from './feelings.controller';
import { FeelingsService } from './feelings.service';

@Module({
  imports: [AuthModule],
  controllers: [FeelingsController],
  providers: [FeelingsService],
})
export class FeelingsModule {}
