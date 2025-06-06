import React, { useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import questionService from '../../services/question.service';
import { useRoute } from '@react-navigation/native';
import colors from '../../../colors';

interface WritingTaskProps {
  taskNumber: number;
  question: string;
  image?: string;
}
const Writing_task: React.FC<WritingTaskProps> = ({ taskNumber, question, image }) => {
  const [isTeacher, setIsTeacher] = useState<boolean>()
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [editQuestion, setEditQuestion] = useState("");
  const [questionId, setQuestionId] = useState<string | null>(null);
  const route = useRoute<any>()
  const { sectionID } = route.params || {};
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
          "type": "WRITING_QUESTION"
        });
        if (result.statusCode === 201) {
          setNewQuestion(result.data[0]?.writingPrompt || result.data[0]?.writtingPrompt || "");
          setQuestionId(result.data[0]?.id);
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }
    }
    decodeTokenAndFetch();
  }, []);

  const handleAddQuestion = async () => {
    const res = await questionService.createQuestionForSection({
      "type": "WRITING_QUESTION",
      "writingPrompt": newQuestion,
      "sectionId": sectionID
    })
    setShowAddModal(false);
    setQuestionId(res.data?.id)
  };

  const handleEditQuestion = async () => {
    if (!questionId) return;
    await questionService.updateQuestion({
      questionId,
      writtingPrompt: editQuestion,
    });
    setNewQuestion(editQuestion);
    setShowEditModal(false);
  };

  const handleDeleteQuestion = async () => {
    if (!questionId) return;
    await questionService.deleteQuestion( questionId );
    setNewQuestion("");
    setQuestionId(null);
    setShowEditModal(false);
  };

  return (
    <View className='mx-[26]'>
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
          {questionId && (
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
      {
        !isTeacher && (
          <>
            <Text className='font-bold text-base'>Writing task {taskNumber}</Text>
          </>
        )
      }
      <Text className='text-sm'>{isTeacher ? newQuestion : question}</Text>
      {image && <Image source={{ uri: image }} className='w-full min-h-[200px] h-[300px] mt-3' />}

      {/* Add Modal */}
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
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Add New Writing Question</Text>
            <TextInput
              placeholder="Enter writing question"
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

      {/* Edit Modal */}
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
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Edit Writing Question</Text>
            <TextInput
              placeholder="Enter writing question"
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
    </View>
  );
};

export default Writing_task