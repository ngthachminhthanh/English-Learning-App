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
  const [newQuestion, setNewQuestion] = useState("");
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
      const username = decoded["username"]

      setIsTeacher(groups?.includes("TEACHER"));
      console.log(decoded);
      console.log(groups?.includes("TEACHER"));

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "WRITING_QUESTION"
        });
        console.log("result", result);

        if (result.statusCode === 201) {
          setNewQuestion(result.data[0]?.writtingPrompt);
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
      "type": "WRITING_QUESTION",
      "writingPrompt": newQuestion,
      "sectionId": sectionID
    })
    setNewQuestion(newQuestion);
    setShowAddModal(false);
  };

  return (
    <View className='mx-[26]'>
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
      {
        !isTeacher && (
          <>
            <Text className='font-bold text-base'>Writing task {taskNumber}</Text>
          </>
        )
      }
      {/* <Text>You should spend about <Text className='font-bold'>{timespend}</Text> minutes on this task.</Text>
      <Text>{question}</Text>

      <Text>You should write at least {maximum_wordcount} words.</Text>
      {
        taskNumber === 1 ? (
          <Text>Summarize the formation by selecting and reporting the main features and make comparisons where relevant.</Text>
        ) : (
          <Text>Give reasons for your answer and include any relevant examples from own knowledge or experience.</Text>
        )
      } */}
      <Text className='text-sm'>{isTeacher ? newQuestion : question}</Text>
      {image && <Image source={{ uri: image }} className='w-full min-h-[200px] h-[300px] mt-3' />}

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
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Add New Speaking Question</Text>
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
    </View>
  );

};


export default Writing_task