import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../type";
import sectionService from "../../services/section.service";
import Section from "../../models/Section";
import { SafeAreaView } from "react-native-safe-area-context";
import HtmlReader from "../../components/HtmlReader";
import BottomNavigation from '../../components/QuestionNavigation';
import { ActivityIndicator } from "react-native-paper";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import questionService from '../../services/question.service';
import colors from '../../../colors';
import { Button } from 'react-native-paper';

type ReadingExerciseProps = {
  scrollRef?: React.RefObject<ScrollView>;
};

export default function ReadingExercise({ scrollRef }: ReadingExerciseProps) {
  const [isTeacher, setIsTeacher] = useState<boolean>()
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState("");
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
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

  // Add MCQ edit modal state
  const [showEditMcqModal, setShowEditMcqModal] = useState(false);
  const [editMcqId, setEditMcqId] = useState<string | null>(null);
  const [editMcqText, setEditMcqText] = useState('');
  const [editMcqChoices, setEditMcqChoices] = useState(['', '', '', '']);
  const [editMcqCorrect, setEditMcqCorrect] = useState<number | null>(null);

  const handleAddMcq = async () => {
    if (!mcqText.trim() || mcqChoices.some(c => !c.trim()) || mcqCorrect === null) {
      console.log('Please fill all fields and select the correct answer.');
      return;
    }
    try {
      const res = await questionService.createQuestionForSection({
        type: "MULTIPLE_CHOICE",
        sectionId: sectionID,
        question: mcqText,
        choices: mcqChoices,
        answer: mcqChoices[mcqCorrect]
      });
      const realId = res.data?.id
      setQuestions(prev => [
        ...prev,
        {
          id: realId, 
          text: mcqText,
          options: mcqChoices,
          answered: false,
        }
      ]);
      setShowAddMultipleModal(false);
      setMcqText('');
      setMcqChoices(['', '', '', '']);
      setMcqCorrect(null);
    } catch (err) {
      console.log(err);
    }
  };

  // Edit Reading Paragraph
  const handleEditQuestion = async () => {
    if (!editQuestionId) return;
    await questionService.updateQuestion({
      questionId: editQuestionId,
      paragraph: editQuestion,
    });
    setNewQuestion(editQuestion);
    setShowEditModal(false);
  };

  const handleDeleteQuestion = async () => {
    if (!editQuestionId) return;
    await questionService.deleteQuestion( editQuestionId);
    setNewQuestion("");
    setEditQuestionId(null);
    setShowEditModal(false);
  };

  // Edit MCQ
  const handleEditMcq = async () => {
    if (!editMcqId || !editMcqText.trim() || editMcqChoices.some(c => !c.trim()) || editMcqCorrect === null) return;
    await questionService.updateQuestion({
      questionId: editMcqId,
      text: editMcqText,
      choices: editMcqChoices,
      answer: editMcqChoices[editMcqCorrect]
    });
    setQuestions(prev =>
      prev.map(q =>
        q.id === editMcqId
          ? { ...q, text: editMcqText, options: editMcqChoices }
          : q
      )
    );
    setShowEditMcqModal(false);
  };

  const handleDeleteMcq = async (questionId: string) => {
    await questionService.deleteQuestion(questionId);
    setQuestions(prev => prev.filter(q => q.id !== questionId));
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
      setIsTeacher(groups?.includes("TEACHER"));

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "READING"
        });
        if (result.statusCode === 201) {
          setNewQuestion(result.data[0]?.paragraph);
          setEditQuestionId(result.data[0]?.id);
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "MULTIPLE_CHOICE"
        });
        if (result.statusCode === 201) {
          setQuestions([
            ...result.data.map((q: any) => ({
              id: q.id || Math.random().toString(),
              text: q.text,
              options: q.choices,
              answered: false,
            }))
          ]);
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }
    }
    decodeTokenAndFetch();
  }, []);

  const handleAddQuestion = async () => {
    const res = await questionService.createQuestionForSection({
      "type": "READING",
      "paragraph": newQuestion,
      "sectionId": sectionID
    })
    setNewQuestion(res.data);
    setShowAddModal(false);
  };

  const handleQuestionChange = () => {}

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
          <>
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
            {newQuestion && (
              <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}>
                <TouchableOpacity
                  style={{ marginRight: 12, padding: 4 }}
                  onPress={() => {
                    setEditQuestion(newQuestion);
                    setShowEditModal(true);
                  }}
                >
                  <Text style={{ color: colors.blue1, fontWeight: "bold" }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 4 }}
                  onPress={handleDeleteQuestion}
                >
                  <Text style={{ color: colors.pink1, fontWeight: "bold" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
                {isTeacher && (
                  <View style={{ flexDirection: "row", marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{ marginRight: 12, padding: 4 }}
                      onPress={() => {
                        setEditMcqId(question.id);
                        setEditMcqText(question.text);
                        setEditMcqChoices([...question.options]);
                        setEditMcqCorrect(null); // You may want to set this to the correct answer index if you have it
                        setShowEditMcqModal(true);
                      }}
                    >
                      <Text style={{ color: colors.blue1, fontWeight: "bold" }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ padding: 4 }}
                      onPress={() => handleDeleteMcq(question.id)}
                    >
                      <Text style={{ color: colors.pink1, fontWeight: "bold" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
                  <></>
                )}
              </View>
            ))
          ) : (
            <Text>No questions available</Text>
          )}
        </View>

        {/* Add Modal for Reading */}
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

        {/* Edit Modal for Reading */}
        <Modal visible={showEditModal} transparent animationType="fade">
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
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Edit Reading Question</Text>
              <TextInput
                placeholder="Edit reading question"
                value={editQuestion}
                onChangeText={setEditQuestion}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
                <TouchableOpacity onPress={() => setShowEditModal(false)} style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#eee",
                  borderRadius: 8,
                  marginRight: 8,
                }}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEditQuestion} style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.blue1,
                  borderRadius: 8,
                }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteQuestion} style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.pink1,
                  borderRadius: 8,
                  marginLeft: 8,
                }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Modal for MCQ */}
        <Modal visible={showEditMcqModal} transparent animationType="fade">
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
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Edit Multiple Choice Question</Text>
              <TextInput
                placeholder="Edit question text"
                value={editMcqText}
                onChangeText={setEditMcqText}
                style={{
                  borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8
                }}
              />
              {editMcqChoices.map((choice, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <TouchableOpacity
                    style={{
                      width: 20, height: 20, borderRadius: 10, borderWidth: 1,
                      borderColor: editMcqCorrect === idx ? colors.blue1 : '#ccc',
                      backgroundColor: editMcqCorrect === idx ? colors.blue1 : '#fff',
                      marginRight: 8,
                      justifyContent: 'center', alignItems: 'center'
                    }}
                    onPress={() => setEditMcqCorrect(idx)}
                  >
                    {editMcqCorrect === idx && <View style={{
                      width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff'
                    }} />}
                  </TouchableOpacity>
                  <TextInput
                    placeholder={`Choice ${idx + 1}`}
                    value={choice}
                    onChangeText={text => {
                      const newChoices = [...editMcqChoices];
                      newChoices[idx] = text;
                      setEditMcqChoices(newChoices);
                    }}
                    style={{
                      flex: 1,
                      borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8
                    }}
                  />
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
                <Button onPress={() => setShowEditMcqModal(false)} style={{ marginRight: 8 }}>Cancel</Button>
                <Button mode="contained" onPress={handleEditMcq}>Save</Button>
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
});