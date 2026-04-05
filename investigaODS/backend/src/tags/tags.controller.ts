import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { TagPaginationQueryDto } from './dto/tag-pagination-query.dto';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('paginated')
  async findPaginated(@Query() query: TagPaginationQueryDto) {
    return this.tagsService.findPaginated(query);
  }

  @Get()
  async findAll(@Query('limit') limit?: string) {
    return this.tagsService.findAll(limit);
  }
}
