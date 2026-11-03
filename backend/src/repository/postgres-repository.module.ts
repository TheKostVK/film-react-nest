import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../app.config.provider';
import { Film } from '../films/entities/film.entity';
import { Schedule } from '../films/entities/schedule.entity';
import { FilmsRepository } from './films.repository';
import { PostgresFilmsRepository } from './postgres-films.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: ['CONFIG'],
      useFactory: (config: AppConfig) => {
        const url = new URL(config.database.url);
        url.username = config.database.username;
        url.password = config.database.password;

        return {
          type: 'postgres',
          url: url.toString(),
          entities: [Film, Schedule],
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature([Film, Schedule]),
  ],
  providers: [{ provide: FilmsRepository, useClass: PostgresFilmsRepository }],
  exports: [FilmsRepository],
})
export class PostgresRepositoryModule {}
