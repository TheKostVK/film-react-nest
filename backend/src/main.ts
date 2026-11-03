import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfig } from './app.config.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>('CONFIG');
  app.setGlobalPrefix('api/afisha');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      exceptionFactory: () =>
        new BadRequestException({ error: 'Некорректные данные заказа' }),
    }),
  );
  app.enableShutdownHooks();
  await app.listen(config.port);
}
bootstrap();
