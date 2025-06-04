
import http from "./Http";

class SectionService {

  baseURI: string;
  constructor() {
    this.baseURI = "section/";
  }
  private getURI(uri: string) {
    return `${this.baseURI}${uri}`;
  }
  async getSection(id: string) {
    const response = await http.get("section/get-all-section-by-lesson/" + id);
    return response;
  }

  async createSection (data: any) {
    return await http.post(this.getURI("teacher/create"), data);
  }
  async getSectionById(id: string) {
    const response = await http.get("section/" + id);
    return response;
  }
}
const sectionService = new SectionService();
export default sectionService;
