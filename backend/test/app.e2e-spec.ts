import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import {
  FilmDto,
  FilmWithScheduleDto,
  ScheduleDto,
} from '../src/films/dto/films.dto';
import { OrderDto, TicketDto } from '../src/order/dto/order.dto';
import { FilmsRepository } from '../src/repository/films.repository';

describe('Афиша API (e2e)', () => {
  let app: INestApplication;
  let film: FilmWithScheduleDto;

  const details: FilmDto = {
    id: '0e33c7f6-27a7-4aa0-8e61-65d7e5effecf',
    rating: 2.9,
    director: 'Итан Райт',
    tags: ['Документальный'],
    image: '/bg1s.jpg',
    cover: '/bg1c.jpg',
    title: 'Архитекторы общества',
    about: 'Документальный фильм',
    description: 'Фильм о влиянии технологий на общество',
  };
  const session: ScheduleDto = {
    id: 'f2e429b0-685d-41f8-a8cd-1d8cb63b99ce',
    daytime: '2024-06-28T10:00:53+03:00',
    hall: 0,
    rows: 5,
    seats: 10,
    price: 350,
    taken: [],
  };
  const findSession = (filmId: string, sessionId: string) =>
    film.id === filmId
      ? film.schedule.find((item) => item.id === sessionId)
      : undefined;
  const repository: FilmsRepository = {
    findAll: async () => [structuredClone(details)],
    findById: async (id) => (id === film.id ? structuredClone(film) : null),
    reserveSeats: async (filmId, sessionId, seats) => {
      const current = findSession(filmId, sessionId);
      if (!current || seats.some((seat) => current.taken.includes(seat))) {
        return false;
      }
      current.taken.push(...seats);
      return true;
    },
    releaseSeats: async (filmId, sessionId, seats) => {
      const current = findSession(filmId, sessionId);
      if (current) {
        current.taken = current.taken.filter((seat) => !seats.includes(seat));
      }
    },
  };
  const ticket = (seat = 1): TicketDto => ({
    film: details.id,
    session: session.id,
    row: 1,
    seat,
  });
  const order = (tickets: TicketDto[] = [ticket()]): OrderDto => ({
    email: 'test@example.com',
    phone: '+79999999999',
    tickets,
  });
  const schedulePath = `/api/afisha/films/${details.id}/schedule`;

  beforeAll(async () => {
    const adapter = new ExpressAdapter();
    const adapterHost = new HttpAdapterHost();
    adapterHost.httpAdapter = adapter;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      // ServeStaticModule выбирает загрузчик до createNestApplication.
      .overrideProvider(HttpAdapterHost)
      .useValue(adapterHost)
      .overrideProvider(FilmsRepository)
      .useValue(repository)
      .overrideProvider('DATABASE')
      .useValue({})
      .overrideProvider('CONFIG')
      .useValue({
        port: 3000,
        database: { driver: 'mongodb', url: 'mongodb://127.0.0.1:27017/test' },
      })
      .compile();

    app = moduleFixture.createNestApplication(adapter);
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    film = {
      ...structuredClone(details),
      schedule: [structuredClone(session)],
    };
  });

  afterAll(async () => {
    await app?.close();
  });

  it('возвращает список фильмов без данных хранилища', () => {
    return request(app.getHttpServer())
      .get('/api/afisha/films')
      .expect(200)
      .expect({ total: 1, items: [details] });
  });

  it('возвращает расписание с номером зала числом', () => {
    return request(app.getHttpServer())
      .get(schedulePath)
      .expect(200)
      .expect({ total: 1, items: [session] });
  });

  it('возвращает 404 для неизвестного фильма', () => {
    return request(app.getHttpServer())
      .get('/api/afisha/films/missing/schedule')
      .expect(404)
      .expect({ error: 'Фильм не найден' });
  });

  it('бронирует несколько билетов и сохраняет занятые места', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send(order([{ ...ticket(), price: 1 }, ticket(2)]))
      .expect(200);

    expect(response.body).toEqual({
      total: 2,
      items: [1, 2].map((seat) => ({
        ...ticket(seat),
        id: expect.any(String),
        daytime: session.daytime,
        price: session.price,
      })),
    });
    expect(response.body.items[0].id).not.toBe(response.body.items[1].id);
    const schedule = await request(app.getHttpServer()).get(schedulePath);
    expect(schedule.body.items[0].taken).toEqual(['1:1', '1:2']);
  });

  it('отклоняет повторное бронирование', async () => {
    await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send(order())
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send(order())
      .expect(400)
      .expect({ error: 'Место уже забронировано' });
  });

  it('не занимает места, если они повторяются внутри заказа', async () => {
    await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send(order([ticket(), ticket()]))
      .expect(400);
    const schedule = await request(app.getHttpServer()).get(schedulePath);
    expect(schedule.body.items[0].taken).toEqual([]);
  });

  it('проверяет поля заказа через общий ValidationPipe', async () => {
    const invalidOrders = [
      { ...order(), email: 'invalid' },
      order([]),
      order([{ ...ticket(), row: 0 }]),
      order([{ ...ticket(), seat: 1.5 }]),
    ];
    for (const body of invalidOrders) {
      await request(app.getHttpServer())
        .post('/api/afisha/order')
        .send(body)
        .expect(400)
        .expect({ error: 'Некорректные данные заказа' });
    }
  });

  it('раздаёт афиши из public', () => {
    return request(app.getHttpServer())
      .get('/content/afisha/bg1s.jpg')
      .expect(200)
      .expect('Content-Type', /image\/jpeg/);
  });
});
