import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { CourseOwningService } from './course-owning.service';
import { CreateCourseOwningDto } from './dto/create-course-owning.dto';
import { DOCUMENTATION, END_POINTS } from 'src/utils/constants';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { User } from 'src/common/decorators/user.decorator';
import { IUser } from 'src/common/guards/at.guard';
import { ResponseObject } from 'src/utils/objects';
import { CourseOwning } from './entities/course-owning.entity';
import { CourseService } from '../course/course.service';
import { log } from 'console';

@ApiBearerAuth()
@ApiTags(DOCUMENTATION.TAGS.COURSE_OWNING)
@Controller(END_POINTS.COURSE_OWNING.BASE)
export class CourseOwningController {
  constructor(
    private readonly courseOwningService: CourseOwningService,
    private readonly courseService: CourseService,
    @InjectMapper() private readonly mapper: Mapper,
  ) { }
  @Post(END_POINTS.COURSE_OWNING.ACTIVE_COURSE)
  @ApiOperation({
    summary: 'Create new course owning',
  })
  async createCourseOwning(
    @Body() createCourseOwningDto: CreateCourseOwningDto,
    @User() user: IUser,
  ) {

    const courseOwning = this.mapper.map(
      createCourseOwningDto,
      CreateCourseOwningDto,
      CourseOwning,
    );

    const course = await this.courseService.findOne(createCourseOwningDto.courseId);
    if (!course) {  
      console.log("error")
    }

    courseOwning.course = course;

    const newCourseOwning = await this.courseOwningService.active(
      createCourseOwningDto.courseId,
      courseOwning,
      user.userAwsId,
    );
    return ResponseObject.create('active course successfully', newCourseOwning);
  }

  @Get()
  findAll() {
    return this.courseOwningService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseOwningService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseOwningService.remove(+id);
  }
}
