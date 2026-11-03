import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongoRepositoryModule } from './mongo-repository.module';
import { PostgresRepositoryModule } from './postgres-repository.module';

@Module({})
export class RepositoryModule {
  /**
   * Выбирает хранилище после чтения переменных из .env.
   * @returns Модуль с репозиторием выбранной базы данных.
   */
  static async forRoot(): Promise<DynamicModule> {
    await ConfigModule.envVariablesLoaded;
    const storage =
      process.env.DATABASE_DRIVER === 'postgres'
        ? PostgresRepositoryModule
        : MongoRepositoryModule;

    return {
      module: RepositoryModule,
      imports: [storage],
      exports: [storage],
    };
  }
}
