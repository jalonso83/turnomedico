import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';

@ApiTags('Public - Doctors')
@Controller('public/doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Search doctors by name, specialty, or city' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'specialty', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async search(
    @Query('q') query?: string,
    @Query('specialty') specialty?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.doctorsService.search(
      query,
      specialty,
      city,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get doctor public profile by slug' })
  async getProfile(@Param('slug') slug: string) {
    return this.doctorsService.getPublicProfile(slug);
  }

  @Get(':slug/slots')
  @ApiOperation({ summary: 'Get available appointment slots for a date' })
  @ApiQuery({ name: 'date', required: true, example: '2026-04-15' })
  async getSlots(
    @Param('slug') slug: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableSlots(slug, date);
  }

  @Get(':slug/reviews')
  @ApiOperation({ summary: 'Get doctor reviews (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReviews(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.doctorsService.getReviews(
      slug,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
