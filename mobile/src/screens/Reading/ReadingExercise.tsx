import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Image, Dimensions, StyleSheet, TouchableOpacity, Modal, TextInput } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../type";
import sectionService from "../../services/section.service";
import Section from "../../models/Section";
import SelectionFormat from "../../components/SelectionFormat/SelectionFormat";
import { SafeAreaView } from "react-native-safe-area-context";
import HtmlReader from "../../components/HtmlReader";
import BottomNavigation from '../../components/QuestionNavigation';
import { ActivityIndicator } from "react-native-paper";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import questionService from '../../services/question.service';
import colors from '../../../colors';
import { Input } from "react-native-elements";
import { Button } from 'react-native-paper';


type ReadingExerciseProps = {
  scrollRef?: React.RefObject<ScrollView>;
};

export default function ReadingExercise({ scrollRef }: ReadingExerciseProps) {
  const [isTeacher, setIsTeacher] = useState<boolean>()
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [showAddMultipleModal, setShowAddMultipleModal] = useState(false);


  const route = useRoute<RouteProp<RootStackParamList, "Reading">>();
  const { sectionID } = route.params;
  const [section, setSection] = useState<Section | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questions, setQuestions] = useState<{ id: string; text: string; options: string[]; answered: boolean }[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [mcqText, setMcqText] = useState('');
  const [mcqChoices, setMcqChoices] = useState(['', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: string]: number }>({});

  const handleAddMcq = async () => {
    if (!mcqText.trim() || mcqChoices.some(c => !c.trim()) || mcqCorrect === null) {
      console.log('Please fill all fields and select the correct answer.');

      return;
    }
    try {
      await questionService.createQuestionForSection({
        type: "MULTIPLE_CHOICE",
        sectionId: sectionID,
        question: mcqText,
        choices: mcqChoices,
        answer: mcqChoices[mcqCorrect]
      });

      setQuestions(prev => [
        ...prev,
        {
          id: Math.random().toString(), // Temporary local id
          text: mcqText,
          options: mcqChoices,
          answered: false,
        }
      ]);
      setShowAddMultipleModal(false);
      setMcqText('');
      setMcqChoices(['', '', '', '']);
      setMcqCorrect(null);

      // Optionally refresh questions here
    } catch (err) {
      console.log(err);

    }
  };

  useEffect(() => {
    interface DecodedToken {
      [key: string]: any;
      "cognito:groups"?: string[];
      "username": string
    }

    const decodeTokenAndFetch = async () => {
      // 1. Decode token and set isTeacher
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode<DecodedToken>(token || "");
      const groups = decoded["cognito:groups"];
      const username = decoded["username"]

      setIsTeacher(groups?.includes("TEACHER"));
      console.log(decoded);
      console.log(groups?.includes("TEACHER"));

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "READING"
        });
        console.log("result", result);

        if (result.statusCode === 201) {
          setNewQuestion(result.data[0]?.paragraph);
        } else {
          console.error(
            "Error fetching course categories, status code: ",
            result.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "MULTIPLE_CHOICE"
        });
        console.log("choices", result.data[0].choices)

        if (result.statusCode === 201) {
          setQuestions(prev => [
            ...prev,
            ...result.data.map((q: any) => ({
              id: q.id || Math.random().toString(),
              text: q.text,
              options: q.choices,
              answered: false,
            }))
          ]);
        } else {
          console.error(
            "Error fetching course categories, status code: ",
            result.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }
      // 2. Fetch course categories

    }
    decodeTokenAndFetch();
  }, []);

  const handleAddQuestion = async () => {
    await questionService.createQuestionForSection({
      "type": "READING",
      "paragraph": newQuestion,
      "sectionId": sectionID
    })
    setNewQuestion(newQuestion);
    setShowAddModal(false);
  };



  // const estimateContentHeight = (content: string) => {
  //   const CHAR_HEIGHT = 0.35; // Estimate height per character
  //   return content.length * CHAR_HEIGHT;
  // };

  // const estimateQuestionGroupHeight = (questionGroup: any) => {
  //   const CHAR_HEIGHT = 0.5; // Estimate height per character
  //   return questionGroup.text.length * CHAR_HEIGHT;
  // };

  // const handleQuestionChange = (questionIndex: number) => {
  //   setCurrentQuestion(questionIndex + 1);
  //   const contentHeight = section ? estimateContentHeight(section.content) : 0;
  //   const questionGroupHeight = section ? estimateQuestionGroupHeight(section.questionGroups[0]) : 0;
  //   scrollViewRef.current?.scrollTo({
  //     y: questionIndex * 50 + contentHeight + questionGroupHeight, // Adjust the scroll position as needed
  //     animated: true,
  //   });
  // };

  const handleQuestionChange = () => {

  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId ? { ...question, answered: !!value } : question
      )
    );
    if (value) {
      setAnsweredQuestions((prevAnswered) => [...prevAnswered, questionId]);
    } else {
      setAnsweredQuestions((prevAnswered) => prevAnswered.filter(id => id !== questionId));
    }
  };

  // Fetch section data from API
  useEffect(() => {
    const fetchSection = async () => {
      try {
        const response = await sectionService.getSectionById(sectionID);
        setSection(response.data);
        if (response.data.questionGroups) {
          const allQuestions = response.data.questionGroups.flatMap((group: any) =>
            group.questions.map((q: any) => ({
              id: q.id,
              text: q.text,
              options: q.options,
              answered: false
            }))
          );
          setQuestions(allQuestions);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchSection();
  }, [sectionID]);

  const questionGroups = section && Array.isArray(section.questionGroups) ? section.questionGroups : [];

  if (!section) {
    return <ActivityIndicator size={"large"} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        className="reading-exercise flex gap-4"
        ref={scrollViewRef}
      >
        {/* Render the main reading content */}
        {isTeacher && (
          <TouchableOpacity
            style={{
              backgroundColor: colors.blue1,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              alignSelf: "center",
              marginBottom: 16,
            }}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add Question</Text>
          </TouchableOpacity>
        )}
        <View className="reading-content flex gap-2 items-center">
          {isTeacher ? (
            <Text>{newQuestion}</Text>
          ) : (
            section.content && <HtmlReader html={section.content} />
          )}
        </View>

        {/* Render each question group and its questions */}
        {isTeacher && (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: colors.pink1,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignSelf: "center",
                marginBottom: 8,
              }}
              onPress={() => setShowAddMultipleModal(true)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Add Multiple Choice Question</Text>
            </TouchableOpacity>

            <Modal
              visible={showAddMultipleModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowAddMultipleModal(false)}
            >
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)'
              }}>
                <View style={{
                  backgroundColor: '#fff',
                  padding: 20,
                  borderRadius: 16,
                  width: '90%'
                }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Add Multiple Choice Question</Text>
                  <TextInput
                    placeholder="Question text"
                    value={mcqText}
                    onChangeText={setMcqText}
                    style={{
                      borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8
                    }}
                  />
                  {mcqChoices.map((choice, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <TouchableOpacity
                        style={{
                          width: 20, height: 20, borderRadius: 10, borderWidth: 1,
                          borderColor: mcqCorrect === idx ? colors.blue1 : '#ccc',
                          backgroundColor: mcqCorrect === idx ? colors.blue1 : '#fff',
                          marginRight: 8,
                          justifyContent: 'center', alignItems: 'center'
                        }}
                        onPress={() => setMcqCorrect(idx)}
                      >
                        {mcqCorrect === idx && <View style={{
                          width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff'
                        }} />}
                      </TouchableOpacity>
                      <TextInput
                        placeholder={`Choice ${idx + 1}`}
                        value={choice}
                        onChangeText={text => {
                          const newChoices = [...mcqChoices];
                          newChoices[idx] = text;
                          setMcqChoices(newChoices);
                        }}
                        style={{
                          flex: 1,
                          borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8
                        }}
                      />
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Button onPress={() => setShowAddMultipleModal(false)} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button mode="contained" onPress={handleAddMcq}>Add</Button>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}

        <View className="reading-questions" style={{ gap: 20, paddingHorizontal: 8 }}>
          {questions.length > 0 ? (
            questions.map((question, idx) => (
              <View
                key={question.id}
                style={{
                  marginBottom: 16,
                  backgroundColor: '#f8f8ff',
                  borderRadius: 14,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: colors.blue1 }}>
                  {idx + 1}. {question.text}
                </Text>
                {question.options && question.options.length > 0 ? (
                  question.options.map((option, oidx) => (
                    <TouchableOpacity
                      key={oidx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor:
                          selectedOptions[question.id] === oidx ? colors.pink1 : '#fff',
                        borderWidth: 1,
                        borderColor:
                          selectedOptions[question.id] === oidx ? colors.pink1 : '#e0e0e0',
                      }}
                      onPress={() =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [question.id]: oidx,
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          borderWidth: 2,
                          borderColor: colors.pink1,
                          marginRight: 12,
                          backgroundColor:
                            selectedOptions[question.id] === oidx ? colors.pink1 : '#fff',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedOptions[question.id] === oidx && (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: '#fff',
                            }}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          color: selectedOptions[question.id] === oidx ? '#fff' : '#333',
                        }}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <>
                  </>
                )}
              </View>
            ))
          ) : (
            <Text>No questions available</Text>
          )}
        </View>
        <Modal visible={showAddModal} transparent animationType="fade">
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <View style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "90%",
            }}>
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Add New Reading Question</Text>
              <TextInput
                placeholder="Enter reading question"
                value={newQuestion}
                onChangeText={setNewQuestion}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
                <TouchableOpacity onPress={() => setShowAddModal(false)} style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#eee",
                  borderRadius: 8,
                  marginRight: 8,
                }}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddQuestion} style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.blue1,
                  borderRadius: 8,
                }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <BottomNavigation
        questions={questions}
        answeredQuestions={answeredQuestions}
        currentQuestion={currentQuestion}
        onQuestionChange={handleQuestionChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}
)
