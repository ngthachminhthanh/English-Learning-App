import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../type";
import questionService from "../../services/question.service";
import studentAnswerService from "../../services/studentAnswer";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import colors from "../../../colors";

export default function ReadingExercise() {
  const route = useRoute<RouteProp<RootStackParamList, "Reading">>();
  const sectionId = route.params?.sectionID;

  const [questions, setQuestions] = useState<any[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: string]: number }>({});
  const [newQuestion, setNewQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const fetchQuestions = async () => {
    try {
      const res = await questionService.getQuestionBySection({
        sectionId: sectionId,
        type: "MULTIPLE_CHOICE",
      });
      if (res && res.data) {
        setQuestions(res.data);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  useEffect(() => {
    const checkRole = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode<any>(token || "");
      const groups = decoded["cognito:groups"];
      setIsTeacher(groups?.includes("TEACHER"));

      const statusRes = await studentAnswerService.getSubmissionStatus(sectionId, token!);
      setIsSubmitted(statusRes.submitted);
      setScore(statusRes.score ?? null);
    };
    checkRole();
    fetchQuestions();
  }, []);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedOptions(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    const answers = Object.entries(selectedOptions).map(([questionId, index]) => {
      const question = questions.find(q => q.id === questionId);
      return {
        questionId,
        type: "MULTIPLE_CHOICE",
        answer: question?.choices[index as number],
      };
    });

    try {
      await studentAnswerService.submitAnswers({ sectionId, answers }, token!);
      setIsSubmitted(true);

      let correctCount = 0;
      questions.forEach(q => {
        const selectedIndex = selectedOptions[q.id];
        const selectedAnswer = q.choices[selectedIndex];
        if (selectedAnswer === q.answer) {
          correctCount += 1;
        }
      });

      setScore(correctCount);
      Alert.alert("Submitted!", `You scored ${correctCount}/${questions.length}`);
    } catch (error) {
      Alert.alert("Submission Failed", "Something went wrong.");
      console.error(error);
    }
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion.trim() || correctAnswerIndex === null || options.some(o => !o.trim())) return;

    try {
      if (editIndex !== null) {
        const editing = questions[editIndex];
        await questionService.updateQuestion({
          questionId: editing.id,
          text: newQuestion,
          choices: options,
          answer: options[correctAnswerIndex],
        });
      } else {
        await questionService.createQuestionForSection({
          sectionId: sectionId,
          type: "MULTIPLE_CHOICE",
          text: newQuestion,
          choices: options,
          answer: options[correctAnswerIndex],
        });
      }
      setNewQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswerIndex(null);
      setEditIndex(null);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  const handleEdit = (index: number) => {
    const q = questions[index];
    setNewQuestion(q.text);
    setOptions(q.choices);
    setCorrectAnswerIndex(q.choices.findIndex((opt: string) => opt === q.answer));
    setEditIndex(index);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reading Exercise</Text>

      {questions.map((q, index) => (
        <View key={q.id} style={styles.questionBox}>
          <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
          {q.choices.map((choice: string, i: number) => {
            const isSelected = selectedOptions[q.id] === i;
            const isCorrect = q.answer === choice;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelectOption(q.id, i)}
                disabled={isSubmitted || isTeacher}
                style={[
                  styles.choiceOption,
                  isSelected && styles.choiceSelected,
                  isSubmitted && isCorrect && styles.optionCorrect,
                  isSubmitted && isSelected && !isCorrect && styles.optionIncorrect,
                ]}
              >
                <Text>{String.fromCharCode(65 + i)}. {choice}</Text>
              </TouchableOpacity>
            );
          })}
          {isTeacher && (
            <TouchableOpacity onPress={() => handleEdit(index)}>
              <Text style={{ color: colors.blue2, marginTop: 4 }}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {!isTeacher && !isSubmitted && (
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.pink3 }]} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      )}

      {isSubmitted && score !== null && (
        <Text style={styles.score}>Your score: {score}/{questions.length}</Text>
      )}

      {isTeacher && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editIndex !== null ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}</Text>
          <TextInput
            placeholder="Nhập câu hỏi"
            value={newQuestion}
            onChangeText={setNewQuestion}
            style={styles.input}
          />
          {options.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <TouchableOpacity onPress={() => setCorrectAnswerIndex(i)} style={styles.radioCircle}>
                <View style={[styles.innerCircle, correctAnswerIndex === i && styles.radioChecked]} />
              </TouchableOpacity>
              <TextInput
                placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChangeText={text => {
                  const newOpts = [...options];
                  newOpts[i] = text;
                  setOptions(newOpts);
                }}
                style={styles.optionInput}
              />
            </View>
          ))}
          <TouchableOpacity onPress={handleSaveQuestion} style={[styles.submitButton, { backgroundColor: colors.pink3 }]}>
            <Text style={styles.submitButtonText}>{editIndex !== null ? "Lưu chỉnh sửa" : "Thêm câu hỏi"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  questionBox: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  questionText: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  choiceOption: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 4,
  },
  choiceSelected: {
    backgroundColor: colors.pink1,
    borderColor: colors.pink3,
  },
  optionCorrect: {
    backgroundColor: "#d4f2d4",
    borderColor: "green",
  },
  optionIncorrect: {
    backgroundColor: "#f2d4d4",
    borderColor: "red",
  },
  form: {
    marginTop: 32,
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#777",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  innerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  radioChecked: {
    backgroundColor: colors.pink3,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: colors.pink3,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  score: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 12,
    color: colors.pink3,
  },
});
