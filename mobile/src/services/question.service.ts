import http from "./Http";

class QuestionService {
  baseURI: string;
  constructor() {
    this.baseURI = "question/";
  }
  private getURI(uri: string) {
    return `${this.baseURI}${uri}`;
  }

  async createQuestionForSection(data: any) {
    return await http.post(this.getURI("create-by-type"), data)
  }

  async getQuestionBySection(data: any) {
    return await http.post(this.getURI("get-by-type"), data)
  }

  async updateQuestion(data: any) {
    return await http.put(this.getURI("update-by-type"), data)
  }
  async deleteQuestion(data: any) {
    return await http.delete(this.getURI(`delete-by-type?questionId=${data}`))
  }
}
const questionService = new QuestionService();
export default questionService;
