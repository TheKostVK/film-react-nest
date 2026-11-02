import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import {
  FilmDto,
  FilmWithScheduleDto,
  ScheduleDto,
} from '../films/dto/films.dto';
import { Film } from '../films/entities/film.entity';
import { Schedule } from '../films/entities/schedule.entity';
import { FilmsRepository } from './films.repository';

@Injectable()
export class PostgresFilmsRepository extends FilmsRepository {
  constructor(
    @InjectRepository(Film) private readonly films: Repository<Film>,
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
  ) {
    super();
  }

  async findAll(): Promise<FilmDto[]> {
    const films = await this.films.find({ order: { id: 'ASC' } });
    return films.map((film) => this.toFilmDto(film));
  }

  async findById(id: string): Promise<FilmWithScheduleDto | null> {
    if (!isUUID(id)) {
      return null;
    }

    const film = await this.films.findOne({
      where: { id },
      relations: { schedule: true },
      order: { schedule: { daytime: 'ASC', id: 'ASC' } },
    });
    if (!film) {
      return null;
    }

    return {
      ...this.toFilmDto(film),
      schedule: film.schedule.map((session) => this.toScheduleDto(session)),
    };
  }

  /**
   * Блокирует сеанс на время проверки и сохранения выбранных мест.
   * @param filmId Идентификатор фильма.
   * @param sessionId Идентификатор сеанса.
   * @param seats Места в формате «ряд:кресло».
   * @returns Удалось ли занять все места.
   */
  async reserveSeats(
    filmId: string,
    sessionId: string,
    seats: string[],
  ): Promise<boolean> {
    if (!isUUID(filmId) || !isUUID(sessionId)) {
      return false;
    }

    return this.schedules.manager.transaction(async (manager) => {
      const schedules = manager.getRepository(Schedule);
      const session = await schedules.findOne({
        where: { id: sessionId, filmId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session || seats.some((seat) => session.taken.includes(seat))) {
        return false;
      }

      session.taken = [...new Set([...session.taken, ...seats])];
      await schedules.save(session);
      return true;
    });
  }

  /**
   * Освобождает места заказа, сохраняя параллельные изменения сеанса.
   * @param filmId Идентификатор фильма.
   * @param sessionId Идентификатор сеанса.
   * @param seats Места, занятые отменяемым заказом.
   */
  async releaseSeats(
    filmId: string,
    sessionId: string,
    seats: string[],
  ): Promise<void> {
    if (!isUUID(filmId) || !isUUID(sessionId)) {
      return;
    }

    await this.schedules.manager.transaction(async (manager) => {
      const schedules = manager.getRepository(Schedule);
      const session = await schedules.findOne({
        where: { id: sessionId, filmId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) {
        return;
      }

      session.taken = session.taken.filter((seat) => !seats.includes(seat));
      await schedules.save(session);
    });
  }

  private toFilmDto(film: Film): FilmDto {
    return {
      id: film.id,
      rating: film.rating,
      director: film.director,
      tags: [...film.tags],
      image: film.image,
      cover: film.cover,
      title: film.title,
      about: film.about,
      description: film.description,
    };
  }

  private toScheduleDto(session: Schedule): ScheduleDto {
    return {
      id: session.id,
      daytime: session.daytime,
      hall: session.hall,
      rows: session.rows,
      seats: session.seats,
      price: session.price,
      taken: [...session.taken],
    };
  }
}
