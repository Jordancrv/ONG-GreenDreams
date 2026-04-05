import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { TagPaginationQueryDto } from './dto/tag-pagination-query.dto';

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

  async findPaginated(query: TagPaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? TagsService.DEFAULT_LIMIT;

    const qb = this.tagsRepository
      .createQueryBuilder('tag')
      .orderBy('tag.name', 'ASC');

    if (query.q?.trim()) {
      qb.where('tag.name LIKE :q', { q: `%${query.q.trim()}%` });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
