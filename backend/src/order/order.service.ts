import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FilmWithScheduleDto } from '../films/dto/films.dto';
import { FilmsRepository } from '../repository/films.repository';
import { OrderDto, OrderedTicketDto, OrderResponseDto } from './dto/order.dto';

interface Reservation {
  film: string;
  session: string;
  seats: string[];
}

@Injectable()
export class OrderService {
  constructor(private readonly filmsRepository: FilmsRepository) {}

  /**
   * Проверяет весь заказ и освобождает уже занятые места при конфликте.
   * @param order Данные заказа с выбранными местами.
   * @returns Билеты с ценой и временем сеанса из базы.
   */
  async create(order: OrderDto): Promise<OrderResponseDto> {
    const films = new Map<string, FilmWithScheduleDto>();
    const reservations = new Map<string, Reservation>();
    const items: OrderedTicketDto[] = [];

    for (const ticket of order.tickets) {
      let film = films.get(ticket.film);
      if (!film) {
        film = await this.filmsRepository.findById(ticket.film);
        if (!film) {
          throw new BadRequestException({ error: 'Фильм не найден' });
        }
        films.set(ticket.film, film);
      }

      const session = film.schedule.find((item) => item.id === ticket.session);
      if (!session) {
        throw new BadRequestException({ error: 'Сеанс не найден' });
      }
      if (ticket.row > session.rows || ticket.seat > session.seats) {
        throw new BadRequestException({ error: 'Места нет в зале' });
      }

      const key = JSON.stringify([ticket.film, ticket.session]);
      const reservation = reservations.get(key) ?? {
        film: ticket.film,
        session: ticket.session,
        seats: [],
      };
      const seat = `${ticket.row}:${ticket.seat}`;
      if (session.taken.includes(seat) || reservation.seats.includes(seat)) {
        throw new BadRequestException({ error: 'Место уже забронировано' });
      }

      reservation.seats.push(seat);
      reservations.set(key, reservation);
      items.push({
        id: randomUUID(),
        film: ticket.film,
        session: ticket.session,
        row: ticket.row,
        seat: ticket.seat,
        daytime: session.daytime,
        price: session.price,
      });
    }

    const reserved: Reservation[] = [];
    try {
      for (const reservation of reservations.values()) {
        const saved = await this.filmsRepository.reserveSeats(
          reservation.film,
          reservation.session,
          reservation.seats,
        );
        if (!saved) {
          throw new BadRequestException({ error: 'Место уже забронировано' });
        }
        reserved.push(reservation);
      }
    } catch (error) {
      await Promise.all(
        reserved.map((reservation) =>
          this.filmsRepository.releaseSeats(
            reservation.film,
            reservation.session,
            reservation.seats,
          ),
        ),
      );
      throw error;
    }

    return { total: items.length, items };
  }
}
