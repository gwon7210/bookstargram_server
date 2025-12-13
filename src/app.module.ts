import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      expandVariables: true,
      validate: (env: Record<string, unknown>) => {
        const requiredKeys = ['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET'];
        for (const key of requiredKeys) {
          if (!env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
          }
        }
        return env;
      },
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    BooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
