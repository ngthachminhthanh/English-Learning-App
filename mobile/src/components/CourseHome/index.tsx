import { useNavigation, useRoute } from "@react-navigation/native";
import { Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import colors from "../../../colors";
// import { Lesson, Section } from "../../models";
// import lessonService from "../../services/lesson.service";
// import sectionService from "../../services/section.service";
import { CourseDetailScreenNavigationProp, CourseScreenRouteProp } from "../../type";
import More from "./More";
import { ActivityIndicator } from "react-native-paper";
import HTML from 'react-native-render-html';  // Import HTML renderer
import { scheduleStudyReminder } from '../../utils/notification.util';
import { TextInput, Modal } from "react-native";
import lessonService from "../../services/lesson.service";
import sectionService from "../../services/section.service";
const { height } = Dimensions.get("window");

// --- Mock Data ---
type Section = {
  id: string;
  title: string;
  type: string;
  uri?: string;
  completed?: boolean;
};

type Lesson = {
  id: string;
  name: string;
  content: string;
  sections: Section[];
};

const mockLessons: Lesson[] = [
  {
    id: "lesson1",
    name: "Lesson 1: Introduction",
    content: "<p>Welcome to Lesson 1!</p>",
    sections: [
      { id: "sec1", title: "Vocabulary", type: "vocab" },
      { id: "sec2", title: "Grammar", type: "grammar" },
      { id: "sec3", title: "Listening Practice", type: "LISTENING", completed: true },
      { id: "sec4", title: "Reading Practice", type: "READING", completed: false },
    ],
  },
  {
    id: "lesson2",
    name: "Lesson 2: Daily Life",
    content: "<p>Let's talk about daily life.</p>",
    sections: [
      { id: "sec5", title: "Vocabulary", type: "vocab" },
      { id: "sec6", title: "Grammar", type: "grammar" },
      { id: "sec7", title: "Speaking Practice", type: "SPEAKING", completed: false },
      { id: "sec8", title: "Writing Practice", type: "WRITING", completed: true },
      { id: "sec9", title: "Video Lesson", type: "video", uri: "https://www.w3schools.com/html/mov_bbb.mp4" },
    ],
  },
];
// --- End Mock Data ---

export default function CourseViewer() {
  const [currentSectionId, setCurrentSectionId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoUri, setCurrentVideoUri] = useState("");
  const [activeTab, setActiveTab] = useState("lessons");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);
  const navigation = useNavigation<CourseDetailScreenNavigationProp>();
  const route = useRoute<CourseScreenRouteProp>();
  const { course } = route.params || {};
  // const course = {
  //   id: "dfdd1ce4-e7d0-483e-9c5d-80f7a5780735",
  //   title: "Toeic Listening Compact Online 450+",
  //   description: "This is a course about how to create a course",
  //   state: "DRAFT",
  //   ratingCount: 0,
  //   ratingAverage: 0,
  //   teacherName: "Bao Nguyen",
  //   createdAt: "2025-05-10T16:38:31.417Z",
  //   updatedAt: "2025-05-10T16:38:31.417Z",
  //   categoryName: "Toeic Listening",
  //   thumbnail_image: "https://d1fc7d6en42vzg.cloudfront.net//https://example.com/thumbnail.jpg",
  // };

  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    name: "",
    description: "",
    content: "",
  });
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [sectionLessonId, setSectionLessonId] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({
    title: "",
    type: "",
  });

  // Replace with your API call
  const handleCreateLesson = async () => {
const res = await lessonService.createLesson({ ...newLesson, courseId: course.id });
  // Use the real UUID from the API response
  const lessonId = res?.data?.id || `lesson${lessons.length + 1}`; 
  setSectionLessonId(lessonId)   
  setLessons(prev => [
      ...prev,
      {
        id: lessonId,
        name: newLesson.name,
        content: newLesson.content,
        sections: [],
      },
    ]);
    setShowCreateLesson(false);
    setNewLesson({ name: "", description: "", content: "" });
  };

  const handleCreateSection = async () => {
    if (!sectionLessonId) return;
    const res = await sectionService.createSection({
      lessonId: sectionLessonId,
      title: newSection.title,
      type: newSection.type,
    });
    const sectionId = res?.data?.id; 
    console.log("created section", res);
    console.log("created section id", sectionId);
    
    setLessons(prev =>
      prev.map(lesson =>
        lesson.id === sectionLessonId
          ? {
            ...lesson,
            sections: [
              ...lesson.sections,
              {
                id: sectionId,
                title: newSection.title,
                type: newSection.type,
              },
            ],
          }
          : lesson
      )
    );
    setShowCreateSection(false);
    setNewSection({ title: "", type: "" });
    setSectionLessonId(null);
  };


  useEffect(() => {
    fetchLessons();

    // Use mock data instead of API

  }, []);

  const fetchLessons = async () => {
    try {
      const res = await lessonService.getAllLessonsByCourse(course.id);
      console.log("Lessons API Response:", res);
      if (res && Array.isArray(res.data)) {
        const lessonsWithSections = await Promise.all(
          res.data.map(async (lesson: Lesson) => {
            const sections = await fetchSection(lesson.id);
            console.log("section", sections);
            
            return { ...lesson, sections: sections ?? [] };
          })
        );
        console.log("Lessons with Sections:", lessonsWithSections);
        setLessons(lessonsWithSections);
      } else {
        setError("No lessons found");
      }
    } catch (error) {
      setError("Error fetching lessons");
      console.error("Error fetching lessons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSection = async (lessonId: string) => {
    try {
      const res = await sectionService.getSection(lessonId);
      console.log(`Sections API Response for lesson ${lessonId}:`, res);
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      console.warn(`No sections found for lesson ${lessonId}`);
      return [];
    } catch (error) {
      console.error(`Error fetching sections for lesson ${lessonId}:`, error);
      return [];
    }
  };

  useEffect(() => {
    const scheduleNotification = async () => {
      await scheduleStudyReminder(
        "Engdigo",
        "Hey checkout the lesson you're studying!"
      );
    };

    scheduleNotification();

    // Cleanup function if needed
    return () => {
      // Any cleanup logic if necessary
    };
  }, [])

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.replayAsync();
    }
  };

  const handleSectionPress = (section: any) => {
    setCurrentSectionId(section.id);
    console.log("pressed section Id", section.id);
    
    if (section.type === "video") {
      setCurrentVideoUri(section.uri);
      setIsPlaying(true);
    }
    switch (section.type) {
      case "LISTENING":
        navigation.navigate("Listening", { sectionID: section.id });
        break;
      case "READING":
        navigation.navigate("Reading", { sectionID: section.id });
        break;
      case "ROOT":
        navigation.navigate("SectionRoot", { sectionID: section.id });
        break;
      case "SPEAKING":
        navigation.navigate("Speaking", { sectionID: section.id });
        break;
      case "WRITING":
        navigation.navigate("Writing", { sectionID: section.id });
        break;
      case "VOCABULARY":
        navigation.navigate("Vocabulary", { sectionID: section.id });
        break;
      case "GRAMMAR":
        navigation.navigate("Grammar", { sectionID: section.id });
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add Lesson Button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#5D5FEF",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          alignSelf: "flex-end",
          margin: 16,
        }}
        onPress={() => setShowCreateLesson(true)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add Lesson</Text>
      </TouchableOpacity>

      {/* Create Lesson Modal */}
      <Modal visible={showCreateLesson} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <View style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 10,
            width: "90%"
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Create New Lesson</Text>
            <TextInput
              placeholder="Lesson Name"
              value={newLesson.name}
              onChangeText={text => setNewLesson({ ...newLesson, name: text })}
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />
            <TextInput
              placeholder="Description"
              value={newLesson.description}
              onChangeText={text => setNewLesson({ ...newLesson, description: text })}
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />
            <TextInput
              placeholder="Content (HTML allowed)"
              value={newLesson.content}
              onChangeText={text => setNewLesson({ ...newLesson, content: text })}
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, minHeight: 60 }}
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowCreateLesson(false)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#eee",
                  borderRadius: 8,
                  marginRight: 8,
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateLesson}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#5D5FEF",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {activeTab === "lessons" &&
          lessons.map((lesson, lessonIndex) => (
            <View key={lessonIndex} style={styles.lessonContainer}>
              <Text style={styles.lessonTitle}>{lesson.name}</Text>
              <Text style={styles.lessonTitle}>
                <HTML source={{ html: lesson.content }} />
              </Text>
              {/* Add Section Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#EF5DA8",
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  alignSelf: "flex-end",
                  marginBottom: 8,
                  marginRight: 16,
                }}
                onPress={() => {
                  setSectionLessonId(lesson.id);
                  setShowCreateSection(true);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add Section</Text>
              </TouchableOpacity>
              <View style={styles.sectionListContainer}>
                <View style={styles.row}>
                  {lesson.sections
                    ?.filter((section) => section.type === "vocab" || section.type === "grammar")
                    .map((section) => (
                      <TouchableOpacity
                        key={section.id}
                        style={[
                          styles.sectionButton,
                          currentSectionId === section.id && styles.sectionButtonActive,
                          section.type === "vocab" && { backgroundColor: colors.blue4, borderRadius: 20 },
                          section.type === "grammar" && { backgroundColor: colors.blue4, borderRadius: 20 },
                        ]}
                        onPress={() => handleSectionPress(section)}
                      >
                        <Icon
                          name={section.type === "vocab" ? "book" : "list"}
                          size={20}
                          color="#666"
                          style={styles.sectionIcon}
                        />
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
                {lesson.sections
                  ?.filter((section) => section.type !== "vocab" && section.type !== "grammar")
                  .map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      style={[
                        styles.sectionButton,
                        currentSectionId === section.id && styles.sectionButtonActive,
                      ]}
                      onPress={() => handleSectionPress(section)}
                    >
                      <Icon
                        name={
                          section.type === "video"
                            ? "play"
                            : section.type === "SPEAKING"
                              ? "mic"
                              : section.type === "LISTENING"
                                ? "headphones"
                                : section.type === "WRITING"
                                  ? "edit-3"
                                  : section.type === "READING"
                                    ? "book-open"
                                    : "circle"
                        }
                        size={20}
                        color="#666"
                        style={styles.sectionIcon}
                      />
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      {"completed" in section &&
                        (section.completed ? (
                          <Icon name="check-circle" size={20} color="green" />
                        ) : (
                          <Icon name="circle" size={20} color="#ccc" />
                        ))}
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          ))}
        {activeTab === "more" && <More />}
      </ScrollView>

      {/* Create Section Modal */}
      <Modal visible={showCreateSection} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <View style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 10,
            width: "90%"
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Create New Section</Text>
            <TextInput
              placeholder="Section Title"
              value={newSection.title}
              onChangeText={text => setNewSection({ ...newSection, title: text })}
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />
            <TextInput
              placeholder="Section Type (e.g. vocab, grammar, LISTENING, etc.)"
              value={newSection.type}
              onChangeText={text => setNewSection({ ...newSection, type: text })}
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateSection(false);
                  setNewSection({ title: "", type: "" });
                  setSectionLessonId(null);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#eee",
                  borderRadius: 8,
                  marginRight: 8,
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSection}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#5D5FEF",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles remain the same

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  videoContainer: {
    backgroundColor: "#1c1c1e",
  },
  videoArea: {
    aspectRatio: 16 / 9,
    backgroundColor: "#262626",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  replayButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  header: {
    padding: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: colors.blue1,
  },
  tabContainer: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.blue1,
  },
  tabText: {
    fontSize: 16,
    color: colors.blue3,
  },
  activeTabText: {
    color: colors.blue1,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  lessonContainer: {
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "600",
    padding: 16,
    paddingBottom: 8,
  },
  sectionListContainer: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    flex: 1,
    marginHorizontal: 4,
  },
  sectionButtonActive: {
    backgroundColor: colors.pink3,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
  },
});