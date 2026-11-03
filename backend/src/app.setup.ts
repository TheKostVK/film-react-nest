import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

/**
 * Применяет общие HTTP-настройки сервера и e2e-тестов.
 * @param app Экземпляр приложения Nest.js.
 */
export function configureApp(app: INestApplication): void {
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
}
