import {
  Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentOrgId } from '../../common/decorators/current-org-id.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  findAll(@CurrentOrgId() orgId: string) {
    return this.usersService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrgId() orgId: string) {
    return this.usersService.findOne(id, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (name, department, active)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name?: string; departmentId?: string; isActive?: boolean },
    @CurrentOrgId() orgId: string,
  ) {
    return this.usersService.update(id, orgId, body);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Add a role to a user' })
  addRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { role: string; scopeType?: string; scopeId?: string },
    @CurrentOrgId() orgId: string,
  ) {
    return this.usersService.addRole(id, orgId, body);
  }

  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a role from a user' })
  removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.usersService.removeRole(id, roleId, orgId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentOrgId() orgId: string) {
    return this.usersService.update(id, orgId, { isActive: false });
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a user' })
  activate(@Param('id', ParseUUIDPipe) id: string, @CurrentOrgId() orgId: string) {
    return this.usersService.update(id, orgId, { isActive: true });
  }
}
