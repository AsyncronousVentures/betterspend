import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @CurrentOrgId() orgId: string,
    @CurrentUserId() userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.list(orgId, userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  unreadCount(
    @CurrentOrgId() orgId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.notificationsService.getUnreadCount(orgId, userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.notificationsService.markRead(id, userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(
    @CurrentOrgId() orgId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.notificationsService.markAllRead(orgId, userId);
  }
}
