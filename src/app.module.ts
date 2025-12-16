import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import { UserBooksModule } from './user-books/user-books.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      expandVariables: true,
      validate: (env: Record<string, unknown>) => {
        const requiredKeys = ['ALADIN_API_KEY'];
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
    UserBooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
