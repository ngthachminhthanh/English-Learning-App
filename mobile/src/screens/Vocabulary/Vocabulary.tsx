import { Text, View, TouchableOpacity, ScrollView, Modal, TextInput, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import VocabFrame, { VocabItem } from "./VocabFrame";
import MainHeader from "../../components/MainHeader";
import { useNavigation } from "@react-navigation/native";
import { FlashCardNavigationProp } from "../../type";
import { useRoute } from "@react-navigation/native";
import { Icon } from "@rneui/themed";
import { scheduleStudyReminder } from "../../utils/notification.util";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import questionService from "../../services/question.service";


const Vocabulary = () => {
  const navigation = useNavigation<FlashCardNavigationProp>();
  const [isTeacher, setIsTeacher] = useState<boolean>();
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [tab, setTab] = useState<"all" | "notLearned">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVocab, setNewVocab] = useState({ term: "", translation: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVocab, setEditVocab] = useState<VocabItem | null>(null);
  const [editVocabData, setEditVocabData] = useState({ term: "", translation: "" });
  const route = useRoute<any>()
  const { sectionID } = route.params || {};
  useEffect(() => {
    interface DecodedToken {
      [key: string]: any;
      "cognito:groups"?: string[];
      "username": string;
    }

    const decodeTokenAndFetch = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode<DecodedToken>(token || "");
      const groups = decoded["cognito:groups"];
      setIsTeacher(groups?.includes("TEACHER"));

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "VOCAB"
        });
        console.log("result", result);

        if (result.statusCode === 201) {
          setVocabList(result.data.map((item: any, idx: number) => ({
            id: item.id,
            term: item.word || "",
            translation: item.meaning || "",
            checked: false,
            showImage: false
          })));
        } else {
          console.error(
            "Error fetching course categories, status code: ",
            result.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }
    };

    decodeTokenAndFetch();
  }, []);

  const handleToggle = (id: number) => {
    setVocabList(prev =>
      prev.map(word => (word.id === id ? { ...word, checked: !word.checked } : word))
    );
  };

  const filteredList =
    tab === "all" ? vocabList : vocabList.filter(word => !word.checked);

  const handleFlashcard = () => {
    navigation.navigate("FlashCard", { wordList: vocabList });
  };
  const handleLearningNotification = () => {
    const notLearned = vocabList.filter(word => !word.checked);
    navigation.navigate("Notification", { wordList: notLearned });
  };

  const handleEditVocab = async () => {
    if (!editVocab) return;
    await questionService.updateQuestion({
      questionId: editVocab.id,
      word: editVocabData.term,
      meaning: editVocabData.translation,
    });
    setVocabList(prev =>
      prev.map(word =>
        word.id === editVocab.id
          ? { ...word, term: editVocabData.term, translation: editVocabData.translation }
          : word
      )
    );
    setShowEditModal(false);
    setEditVocab(null);
  };

  const handleDeleteVocab = async (id: number) => {
    await questionService.deleteQuestion(id );
    setVocabList(prev => prev.filter(word => word.id !== id));
  };
  const handleAddVocab = async () => {
    const createdVocab = await questionService.createQuestionForSection({
      type: "VOCAB",
      word: newVocab.term,
      meaning: newVocab.translation,
      sectionId: sectionID
    });

    console.log("createdVocab",createdVocab);
    
    setVocabList(prev => [
      ...prev,
      {
        id: createdVocab.data.id,
        term: newVocab.term,
        translation: newVocab.translation,
        checked: false,
      },
    ]);
    setShowAddModal(false);
    setNewVocab({ term: "", translation: "" });
  };

  return (
    <SafeAreaView>
      <MainHeader onBellPress={handleLearningNotification} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginTop: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#5D5FEF" }}>Vocabulary</Text>
        {isTeacher && (
          <TouchableOpacity
            style={{ backgroundColor: "#5D5FEF", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="mx-4 my-5">
        <View>
          <Text className="text-black text-sm">{vocabList.length} words</Text>
          <Text className="text-[#757575] text-sm font-normal">
            learned: {vocabList.filter(w => w.checked).length}/{vocabList.length}
          </Text>
        </View>

        {/* Tabs */}
        {
          !isTeacher && (
            <>
              <View className="flex flex-row mt-3 gap-5">
                <TouchableOpacity onPress={() => setTab("all")}>
                  <Text className={`text-sm font-normal ${tab === "all" ? "text-[#5d5fef]" : "text-[#a5a6f6]"}`}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTab("notLearned")}>
                  <Text className={`text-sm font-normal ${tab === "notLearned" ? "text-[#5d5fef]" : "text-[#a5a6f6]"}`}>
                    Not learned
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )
        }


        {/* Vocab list */}
        <ScrollView style={{ marginTop: 30 }}>
          {vocabList.length > 0 ? vocabList.map(word => (
            <View key={word.id} style={{ flexDirection: "row", alignItems: "center" }}>
              <VocabFrame word={word} onToggle={() => handleToggle(word.id)} />
              {isTeacher && (
                <>
                  <TouchableOpacity
                    style={{ marginLeft: 8, padding: 4 }}
                    onPress={() => {
                      setEditVocab(word);
                      setEditVocabData({ term: word.term, translation: word.translation });
                      setShowEditModal(true);
                    }}
                  >
                    <Icon name="edit" type="feather" size={20} color="#5D5FEF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ marginLeft: 4, padding: 4 }}
                    onPress={() => handleDeleteVocab(word.id)}
                  >
                    <Icon name="trash-2" type="feather" size={20} color="#FF4D4F" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )) : (
            <Text>No vocab</Text>
          )}
        </ScrollView>

        {/* Buttons */}
        {
          !isTeacher && (
            <>
              <View className="mt-5 items-center">
                <TouchableOpacity
                  onPress={handleFlashcard}
                  style={{
                    borderColor: "#ef5da8",
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#ef5da8", fontWeight: "600" }}>
                    Learn with flashcards
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#ef5da8",
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 50,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Create quiz</Text>
                </TouchableOpacity>
              </View>
            </>
          )
        }

      </View>

      {/* Add Vocab Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Add New Vocab</Text>
            <TextInput
              placeholder="Term (e.g. home(n))"
              value={newVocab.term}
              onChangeText={text => setNewVocab({ ...newVocab, term: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Translation"
              value={newVocab.translation}
              onChangeText={text => setNewVocab({ ...newVocab, translation: text })}
              style={styles.input}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddVocab} style={styles.addBtn}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Edit Vocab</Text>
            <TextInput
              placeholder="Term (e.g. home(n))"
              value={editVocabData.term}
              onChangeText={text => setEditVocabData({ ...editVocabData, term: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Translation"
              value={editVocabData.translation}
              onChangeText={text => setEditVocabData({ ...editVocabData, translation: text })}
              style={styles.input}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditVocab} style={styles.addBtn}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginRight: 8,
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#5D5FEF",
    borderRadius: 8,
  },
});

export default Vocabulary;