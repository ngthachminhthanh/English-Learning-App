import http from "./Http";

class LessonService {
  baseURI: string;
  constructor() {
    this.baseURI = "lesson/";
  }
  private getURI(uri: string) {
    return `${this.baseURI}${uri}`;
  }

  async createLesson (data: any) {
    return await http.post(this.getURI(`normal`), data);
  }
  async getAllLessonsByCourse(courseId: string) {
    return await http.get(this.getURI(`get-all-lessons-by-course/${courseId}`));
  }
}
const lessonService = new LessonService();
export default lessonService;
