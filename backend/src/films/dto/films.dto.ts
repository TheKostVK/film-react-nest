export class FilmDto {
  id: string;
  rating: number;
  director: string;
  tags: string[];
  image: string;
  cover: string;
  title: string;
  about: string;
  description: string;
}

export class ScheduleDto {
  id: string;
  daytime: string;
  hall: number;
  rows: number;
  seats: number;
  price: number;
  taken: string[];
}

export class FilmWithScheduleDto extends FilmDto {
  schedule: ScheduleDto[];
}

export class FilmsResponseDto {
  total: number;
  items: FilmDto[];
}

export class ScheduleResponseDto {
  total: number;
  items: ScheduleDto[];
}
