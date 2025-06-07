import React from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Vocabulary: { sectionID: string };
  // Add other routes if needed
};

export default function DirectToSectionCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const directToSectionCardMocks = [
    {
      sectionDescription: "THE COMPLETE GUIDE TO IELTS READING GENERAL",
      lesson: 1,
      section: 2,
    },
    {
      sectionDescription: "IELTS WRITING TASK 2: ESSAY STRUCTURE AND TIPS",
      lesson: 3,
      section: 1,
    },
    {
      sectionDescription: "LISTENING PRACTICE: UNDERSTANDING ACCENTS",
      lesson: 2,
      section: 4,
    },
  ];
  return (
    <>
      {directToSectionCardMocks.map((card, idx) => (
        <TouchableOpacity
          key={idx}
          className="w-48 h-16 border border-blue1 flex flex-row"
          onPress={() =>
            navigation.navigate("Vocabulary", { sectionID: "50fd2357-4e04-4225-b413-51ff7c879b11" })
          }
          activeOpacity={0.8}
        >
          <View className="w-1/3 h-full bg-blue1 flex items-center justify-center">
            <Image
              source={require("../../../assets/sectionIcon.png")}
              className="w-5 h-8"
            />
          </View>
          <View className="w-2/3 flex flex-col justify-around p-1">
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              className="w-full text-[10px] text-gray-500"
            >
              {card.sectionDescription}
            </Text>
            <Text className="text-[12px] text-black">Lesson {card.lesson}</Text>
            <Text className="text-[12px] text-black">Section {card.section}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}