import http from "./Http";

class CourseCategoryService {
  async getCourseCategories() {
    try {
      const response = await http.get("course-category");
      return response;
    } catch (error: any) {
      throw new Error(`HTTP error! status: ${error.message}`);
    }
  }

  async createCourseCategories(data: any) {
    try {
      const response = await http.post("course-category", data);
      return response;
    } catch (error: any) {
      throw new Error(`HTTP error! status: ${error.message}`);
    }
  }
}

export default new CourseCategoryService();
