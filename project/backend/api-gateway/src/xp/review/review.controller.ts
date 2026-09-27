/**
 * Service: api-gateway
 *
 * Proxies incoming HTTP requests for review operations to the review-owning service.
 * Validates JWT authentication and forwards each request via ProxyService.
 *
 * Functions:
 * - {@link ReviewController#getAll} - Forwards a request to retrieve all reviews.
 * - {@link ReviewController#resolve} - Forwards a request to resolve a review with a decision.
 * - {@link ReviewController#delete} - Forwards a request to delete a review.
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import {
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { ProxyService } from '../../proxy/proxy.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ResolveReviewDto } from '../dto/resolve-review.dto';
import { ReviewListItemDto } from '../dto/review-list-item.dto';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewController {
  private readonly reviewServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.reviewServiceUrl = this.config.get<string>(
      'XP_SERVICE_URL',
      'http://localhost:3005',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all pending/handled reviews' })
  @ApiResponse({ status: 200, type: [ReviewListItemDto] })
  getAll() {
    return this.proxy.forward({
      url: `${this.reviewServiceUrl}/reviews`,
      method: 'GET',
    });
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Resolve a review with a leak/no-leak decision' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReviewDto,
  ) {
    return this.proxy.forward({
      url: `${this.reviewServiceUrl}/reviews/${id}/resolve`,
      method: 'PATCH',
      data: dto,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.proxy.forward({
      url: `${this.reviewServiceUrl}/reviews/${id}`,
      method: 'DELETE',
    });
  }
}
