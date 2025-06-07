import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';

import { User } from '../../common/decorators/user.decorator';
import { User as UserEntity } from './entities/user.entity';
import { DOCUMENTATION, END_POINTS } from '../../utils/constants';
import { ResponseObject } from '../../utils/objects';
import { IUser } from '../../common/guards/at.guard';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { UserDto } from './dto/userD.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { Public } from 'src/common/decorators/public.decorator';

@ApiBearerAuth()
@ApiTags(DOCUMENTATION.TAGS.USER)
@Controller(END_POINTS.USER.BASE)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @InjectMapper() private readonly mapper: Mapper,
  ) { }

  @Public()
  @Get("all")
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers() {
    const users = await this.userService.findAll();
    return ResponseObject.create('All users retrieved', users);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by aws user ID' })
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return ResponseObject.create('User deleted');
  }

  @Put("update")
  @ApiOperation({ summary: 'Update user information' })
  async updateUser(
    @User() user: IUser,
    @Body() body: {
      firstName?: string,
      lastName?: string,
      email?: string,
      phone?: string,
      avatarURL?: string
    }
  ) {
    const res = await this.userService.updateByType({
      awsId: user.userAwsId,
      ...body
    });

    return ResponseObject.create('User retrieved', res);
  }


  @Get(END_POINTS.USER.ME)
  @ApiOperation({ summary: 'Get user information' })
  async getMe(@User() user: IUser) {
    const res = await this.userService.findMe(user.userAwsId);

    return ResponseObject.create('User retrieved', res);
  }

  @Post(END_POINTS.USER.CREATE)
  @ApiOperation({
    summary:
      'Create a user when normal user or oauth user not found in database',
  })
  async createUser(@User() user: IUser, @Body() userDto: UserDto) {
    const userCreated = this.mapper.map(userDto, UserDto, UserEntity);
    const res = await this.authService.create(userCreated, user.userName);
    return ResponseObject.create('User created', res);
  }
}
