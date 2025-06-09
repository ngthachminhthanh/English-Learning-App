import React, { useEffect, useState } from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import lessonService from "../../services/lesson.service";
import sectionService from "../../services/section.service";

type RootStackParamList = {
  Vocabulary: { sectionID: string };
  Reading: { sectionID: string };
  Listening: { sectionID: string };
  Writing: { sectionID: string };
  Speaking: { sectionID: string };
  Grammar: { sectionID: string };
  SectionRoot: { sectionID: string };
};

type Section = {
  id: string;
  title: string;
  type: string;
  uri?: string;
};

type Lesson = {
  id: string;
  name: string;
  content: string;
  sections: Section[];
};

type Props = {
  courseId: string;
  courseName: string;
};

export default function DirectToSectionCard({ courseId, courseName }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cards, setCards] = useState<{ section: Section; lessonName: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lessonRes = await lessonService.getAllLessonsByCourse(courseId);
        const lessons = lessonRes?.data || [];

        const cardData: { section: Section; lessonName: string }[] = [];

        for (const lesson of lessons) {
          const sectionRes = await sectionService.getSection(lesson.id);
          const sections = sectionRes?.data || [];
          for (const section of sections) {
            if (
              ["VOCABULARY", "READING", "LISTENING", "WRITING", "SPEAKING", "GRAMMAR"].includes(section.type)
            ) {
              cardData.push({ section, lessonName: lesson.name });
            }
          }
        }

        setCards(cardData.slice(0, 5)); // giới hạn 5 thẻ
      } catch (error) {
        console.error("Error loading section cards:", error);
      }
    };

    fetchData();
  }, [courseId]);

  const handleNavigate = (section: Section) => {
    const routeMap: Record<string, keyof RootStackParamList> = {
      VOCABULARY: "Vocabulary",
      READING: "Reading",
      LISTENING: "Listening",
      WRITING: "Writing",
      SPEAKING: "Speaking",
      GRAMMAR: "Grammar",
    };

    const route = routeMap[section.type];
    if (route) {
      navigation.navigate(route, { sectionID: section.id });
    }
  };

  return (
    <>
      {cards.map((card, idx) => (
        <TouchableOpacity
          key={idx}
          style={{
            width: 180,
            height: 90,
            borderWidth: 1,
            borderColor: "#5D5FEF",
            borderRadius: 10,
            flexDirection: "row",
            marginRight: 10,
            overflow: "hidden",
          }}
          onPress={() => handleNavigate(card.section)}
          activeOpacity={0.8}
        >
          <View style={{ width: "33%", backgroundColor: "#5D5FEF", alignItems: "center", justifyContent: "center" }}>
            <Image
              source={require("../../../assets/sectionIcon.png")}
              style={{ width: 20, height: 32 }}
            />
          </View>
          <View style={{ width: "67%", padding: 6, justifyContent: "center" }}>
            <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: "bold", color: "#5D5FEF" }}>
              {courseName}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 10, color: "#555" }}>
              {card.section.title}
            </Text>
            <Text style={{ fontSize: 12 }}>{card.lessonName}</Text>
            <Text style={{ fontSize: 12 }}>{card.section.type}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}
