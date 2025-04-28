import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ScrollView } from "react-native";
import { Course, MyCourse } from "./models"
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
    Grammar: {id:string};
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
  };
export type HeaderNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Notification"
>;

export type LearningScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Learning"
>;