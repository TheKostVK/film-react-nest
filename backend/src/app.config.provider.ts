import { ConfigService } from '@nestjs/config';

export const configProvider = {
  provide: 'CONFIG',
  inject: [ConfigService],
  useFactory: (config: ConfigService): AppConfig => {
    const port = Number(config.get<string>('PORT', '3000'));
    const driver = config.get<string>('DATABASE_DRIVER', 'mongodb');
    const url = config.get<string>(
      'DATABASE_URL',
      driver === 'postgres'
        ? 'postgresql://127.0.0.1:5432/prac'
        : 'mongodb://127.0.0.1:27017/prac',
    );
    const username = config.get<string>('DATABASE_USERNAME');
    const password = config.get<string>('DATABASE_PASSWORD');

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT должен быть целым числом от 1 до 65535');
    }
    if (driver !== 'mongodb' && driver !== 'postgres') {
      throw new Error('DATABASE_DRIVER должен быть mongodb или postgres');
    }
    const protocol =
      driver === 'postgres'
        ? /^postgres(?:ql)?:\/\//
        : /^mongodb(?:\+srv)?:\/\//;
    if (!protocol.test(url)) {
      throw new Error('DATABASE_URL не соответствует выбранному драйверу');
    }
    if (driver === 'postgres' && (!username || !password)) {
      throw new Error(
        'Укажите DATABASE_USERNAME и DATABASE_PASSWORD для PostgreSQL',
      );
    }

    return { port, database: { driver, url, username, password } };
  },
};

export interface AppConfig {
  port: number;
  database: AppConfigDatabase;
}

export interface AppConfigDatabase {
  driver: 'mongodb' | 'postgres';
  url: string;
  username?: string;
  password?: string;
}
