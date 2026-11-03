import { Module } from '@nestjs/common';
import { databaseProvider } from './database.provider';
import { FilmsRepository } from './films.repository';
import { MongoFilmsRepository } from './mongo-films.repository';

@Module({
  providers: [
    databaseProvider,
    { provide: FilmsRepository, useClass: MongoFilmsRepository },
  ],
  exports: [FilmsRepository],
})
export class RepositoryModule {}
