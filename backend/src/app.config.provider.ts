import { ConfigService } from '@nestjs/config';

export const configProvider = {
  provide: 'CONFIG',
  inject: [ConfigService],
  useFactory: (config: ConfigService): AppConfig => {
    const port = Number(config.get<string>('PORT', '3000'));
    const driver = config.get<string>('DATABASE_DRIVER', 'mongodb');
    const url = config.get<string>(
      'DATABASE_URL',
      'mongodb://127.0.0.1:27017/prac',
    );

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT должен быть целым числом от 1 до 65535');
    }
    if (driver !== 'mongodb' || !/^mongodb(?:\+srv)?:\/\//.test(url)) {
      throw new Error(
        'Укажите DATABASE_DRIVER=mongodb и корректный DATABASE_URL',
      );
    }

    return { port, database: { driver, url } };
  },
};

export interface AppConfig {
  port: number;
  database: AppConfigDatabase;
}

export interface AppConfigDatabase {
  driver: string;
  url: string;
}
