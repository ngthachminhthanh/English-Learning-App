import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ScrollView } from "react-native";
import { Course, MyCourse } from "./models"
import { ImageSourcePropType } from "react-native";
import { VocabItem } from "./screens/Vocabulary/VocabFrame";

export type RootStackParamList = {
    SplashScreen: undefined;
    Login: undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
    OTPVerification: { username: string; isConfirmSignUp: boolean };
    ResetPassword: { username: string; confirmationCode: string };
    AuthCongrats: { isConfirmSignUp: boolean };
    Learning: undefined;
    Course: { course: MyCourse };
    Reading: { scrollRef?: React.RefObject<ScrollView>; sectionID: string };
    Grammar: {sectionID:string};
    GrammarDetail: { id: string };
    CourseDetail: { course: Course };
    CourseHome: { course: MyCourse };
    PayWithBank: { courseID: string; coursePrice: number };
    PayWithCard: { courseID: string ;coursePrice: number};
    Notification: undefined;
    Listening: { sectionID: any; scrollRef?: React.RefObject<ScrollView> };
    Validation: { courseBuyingId: string };
    BottomTabsNavigator: undefined;
    SectionRoot: { sectionID: string };
    Speaking: { sectionID: string };
    Writing: { sectionID: string };
    Vocabulary: { sectionID: string };
    QuestionDetails: {
      user: { avatar: ImageSourcePropType; name: string; date: Date },
      title: string,
      question: string,
      answers: { user: { avatar: ImageSourcePropType; name: string; date: Date }; answer: string }[],
    }
    QandA: undefined
    FlashCard: { wordList: VocabItem[]; }
  };
export type HeaderNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Notification"
>;

export type LearningScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Learning"
>;

export type QScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QuestionDetails"
>;

export type FlashCardNavigationProp = StackNavigationProp<
  RootStackParamList,
  "FlashCard"
>;


export type GrammarScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Grammar"
>;

export type GrammarScreenRouteProp = RouteProp<RootStackParamList, "Grammar">;

export type GrammarDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "GrammarDetail"
>;

export type QandAScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QandA"
>;

export type CourseDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CourseDetail" | "Listening" | "Reading" | "Vocabulary" | "Grammar"
>;

export type CourseScreenRouteProp = RouteProp<RootStackParamList, "Course">;