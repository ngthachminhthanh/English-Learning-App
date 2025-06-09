import http from "./Http";

class CourseOwning {
    baseURI: string;
    constructor() {
        this.baseURI = "course-owning/";
    }
    private getURI(uri: string) {
        return `${this.baseURI}${uri}`;
    }

    async activeCourse(courseId: string) {
        return await http.post(
            this.getURI("active-course"),
            {
                courseId: courseId,
                active: true,
            },
        );
    }
}
const courseOwning = new CourseOwning();
export default courseOwning;