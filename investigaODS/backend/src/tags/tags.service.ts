import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  private static readonly DEFAULT_LIMIT = 24;
  private static readonly MAX_LIMIT = 100;

  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findAll(limitParam?: string) {
    const parsed = Number.parseInt(limitParam ?? '', 10);
    const limit = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), TagsService.MAX_LIMIT)
      : TagsService.DEFAULT_LIMIT;

    return this.tagsRepository.find({
      order: { name: 'ASC' },
      take: limit,
    });
  }
}
