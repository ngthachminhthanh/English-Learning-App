import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import VocabFrame, { VocabItem } from "./VocabFrame";
import MainHeader from "../../components/MainHeader";
import { useNavigation } from "@react-navigation/native";
import { FlashCardNavigationProp } from "../../type";
import { Icon } from "@rneui/themed";

const initialVocab: VocabItem[] = [
  { id: 1, term: "home(n)", translation: "nhà", checked: false, showImage: true },
  { id: 2, term: "nigga(n)", translation: "daden", checked: false },
  { id: 3, term: "blue(a)", translation: "xanh", checked: true },
];

const Vocabulary = () => {
  const navigation = useNavigation<FlashCardNavigationProp>();
  const [vocabList, setVocabList] = useState<VocabItem[]>(initialVocab);
  const [tab, setTab] = useState<"all" | "notLearned">("all");

  const handleToggle = (id: number) => {
    setVocabList(prev =>
      prev.map(word => (word.id === id ? { ...word, checked: !word.checked } : word))
    );
  };

  const filteredList =
    tab === "all" ? vocabList : vocabList.filter(word => !word.checked);

  const handleFlashcard = () => {
    const notLearned = vocabList.filter(word => !word.checked);
    navigation.navigate("Notification", { wordList: notLearned });
  };

  return (
    <SafeAreaView>
      <MainHeader
        onBellPress={() => handleFlashcard()}
      />
      {/* MainHeader with bell button moved to the header area */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginTop: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#5D5FEF" }}>Vocabulary</Text>

      </View>

      <View className="mx-4 my-5">
        <View>
          <Text className="text-black text-sm">{vocabList.length} words</Text>
          <Text className="text-[#757575] text-sm font-normal">
            learned: {vocabList.filter(w => w.checked).length}/{vocabList.length}
          </Text>
        </View>

        {/* Tabs */}
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

        {/* Vocab list */}
        <ScrollView style={{ marginTop: 30 }}>
          {filteredList.map(word => (
            <VocabFrame key={word.id} word={word} onToggle={() => handleToggle(word.id)} />
          ))}
        </ScrollView>

        {/* Buttons */}
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
      </View>
    </SafeAreaView>
  );
};

export default Vocabulary;