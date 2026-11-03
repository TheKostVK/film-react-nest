import { createConnection } from 'mongoose';
import { AppConfig } from '../app.config.provider';

export const databaseProvider = {
  provide: 'DATABASE',
  inject: ['CONFIG'],
  useFactory: (config: AppConfig) =>
    createConnection(config.database.url).asPromise(),
};
