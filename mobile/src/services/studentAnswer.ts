// src/services/StudentAnswerService.ts
import http from "./Http";

class StudentAnswerService {
  baseURI: string;

  constructor() {
    this.baseURI = "student-answer/";
  }

  private getURI(uri: string) {
    return `${this.baseURI}${uri}`;
  }

  async getSubmissionStatus(sectionId: string) {
    return await http.get(this.getURI(`status/${sectionId}`));
  }

  async submitAnswers(payload: {
    sectionId: string;
    answers: {
      questionId: string;
      type: "MULTIPLE_CHOICE" | "SPEAKING" | "WRITING";
      answer?: string;
      fileUrl?: string;
    }[];
  }) {
    return await http.post(this.getURI("submit"), payload);
  }
}

const studentAnswerService = new StudentAnswerService();
export default studentAnswerService;
