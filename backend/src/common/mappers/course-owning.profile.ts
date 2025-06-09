import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { CreateCourseBuyingDto } from 'src/module/course-buying/dto/create-course-buying.dto';
import { CreateCourseOwningDto } from 'src/module/course-owning/dto/create-course-owning.dto';
import { CourseOwning } from 'src/module/course-owning/entities/course-owning.entity';

@Injectable()
export class CourseOwningProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }
  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        CreateCourseOwningDto,
        CourseOwning
      );
    };
  }
}
