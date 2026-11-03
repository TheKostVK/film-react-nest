import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import {
  FilmDto,
  FilmWithScheduleDto,
  ScheduleDto,
} from '../films/dto/films.dto';
import { FilmsRepository } from './films.repository';
import { FilmRecord, filmSchema, ScheduleRecord } from './films.schema';

@Injectable()
export class MongoFilmsRepository
  extends FilmsRepository
  implements OnModuleDestroy
{
  private readonly films: Model<FilmRecord>;

  constructor(@Inject('DATABASE') private readonly connection: Connection) {
    super();
    this.films = connection.model('Film', filmSchema);
  }

  async findAll(): Promise<FilmDto[]> {
    const films = await this.films.find().exec();
    return films.map((film) => this.toFilmDto(film));
  }

  async findById(id: string): Promise<FilmWithScheduleDto | null> {
    const film = await this.films.findOne({ id }).exec();
    if (!film) {
      return null;
    }

    return {
      ...this.toFilmDto(film),
      schedule: film.schedule.map((session) => this.toScheduleDto(session)),
    };
  }

  /**
   * Занимает места, только если они все свободны в указанном сеансе.
   * @param filmId Идентификатор фильма.
   * @param sessionId Идентификатор сеанса.
   * @param seats Места в формате «ряд:кресло».
   * @returns Удалось ли занять все места одним обновлением.
   */
  async reserveSeats(
    filmId: string,
    sessionId: string,
    seats: string[],
  ): Promise<boolean> {
    const result = await this.films
      .updateOne(
        {
          id: filmId,
          schedule: {
            $elemMatch: { id: sessionId, taken: { $nin: seats } },
          },
        },
        { $addToSet: { 'schedule.$.taken': { $each: seats } } },
      )
      .exec();

    return result.matchedCount === 1;
  }

  /**
   * Освобождает места при отмене незавершённого заказа.
   * @param filmId Идентификатор фильма.
   * @param sessionId Идентификатор сеанса.
   * @param seats Места, занятые этим заказом.
   */
  async releaseSeats(
    filmId: string,
    sessionId: string,
    seats: string[],
  ): Promise<void> {
    await this.films
      .updateOne(
        { id: filmId, 'schedule.id': sessionId },
        { $pull: { 'schedule.$.taken': { $in: seats } } },
      )
      .exec();
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection.close();
  }

  private toFilmDto(film: FilmDto): FilmDto {
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

  private toScheduleDto(session: ScheduleRecord): ScheduleDto {
    return {
      id: session.id,
      daytime: session.daytime,
      hall: String(session.hall),
      rows: session.rows,
      seats: session.seats,
      price: session.price,
      taken: [...session.taken],
    };
  }
}
