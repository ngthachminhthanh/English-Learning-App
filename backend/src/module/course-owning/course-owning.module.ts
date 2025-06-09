import { Module } from '@nestjs/common';
import { CourseOwningService } from './course-owning.service';
import { CourseOwningController } from './course-owning.controller';
import { CourseOwningProfile } from 'src/common/mappers/course-owning.profile';
import { CourseModule } from '../course/course.module'; // Import the CourseModule
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseService } from '../course/course.service';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseService]), // Register the CourseOwning entity
    CourseModule, // Import CourseModule to provide CourseService
    AutomapperModule.forRoot({
      strategyInitializer: classes(), // Configure Automapper with classes strategy
    }),
  ],
  controllers: [CourseOwningController],
  providers: [CourseOwningService, CourseOwningProfile],
})
export class CourseOwningModule {}
