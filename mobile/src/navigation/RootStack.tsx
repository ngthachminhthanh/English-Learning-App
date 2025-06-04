import { createStackNavigator } from "@react-navigation/stack";
import BottomTabsNavigator from "./BottomTabsNavigator";
import CourseDetail from "../screens/CourseDetail";
import CourseHome from "../components/CourseHome";
import GrammarDetail from "../screens/Grammar/GrammarDetail";
import Reading from "../screens/Reading";
import PayWithBank from "../screens/CourseDetail/PayWithBank";
import PayWithCard from "../screens/CourseDetail/PayWithCard";
import Notification from "../screens/Notification";
import HeaderRight from "./HeaderRight";
import { useRef } from "react";
import { ScrollView } from "react-native-gesture-handler";
import ListeningExerciseScreen from "../screens/Listening/ListeningExercise";
import SpeakingExercise from "../components/Speaking.tsx";
import WritingExercise from "../screens/Writing/WritingExercise";
import SectionRoot from "../screens/SectionRoot";
import {
    // AuthCongrats,
    // ForgotPassword,
    Login,
    // OTPVerification,
    // ResetPassword,
    SignUp,
} from "../screens/Auth";
import SplashScreen from "../screens/Splash/SplashScreen";
import CheckKey from "../screens/CourseDetail/CheckKey";
import DetailGrammar from "../screens/Grammar/DetailGrammar";
import Learning from "../screens/Learning";
import CourseViewer from "../components/CourseHome";
import Vocabulary from "../screens/Vocabulary";
import FlashCard from "../screens/FlashCard";
import Grammar from "../screens/Grammar";


import { QuestionListScreen } from "../components/Q&A";


export default function RootStack() {
    const Stack = createStackNavigator();
    const scrollRef = useRef<ScrollView>(null);
    return (
        <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
                name="SplashScreen"
                component={SplashScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SignUp"
                component={SignUp}
                options={{ headerShown: false }}
            />
            {/* <Stack.Screen
                name="ForgotPassword"
                component={ForgotPassword}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="OTPVerification"
                component={OTPVerification}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ResetPassword"
                component={ResetPassword}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AuthCongrats"
                component={AuthCongrats}
                options={{ headerShown: false }}
            /> */}
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
                name="BottomTabsNavigator"
                component={BottomTabsNavigator}
            />

            <Stack.Screen
                name="Grammar"
                component={Grammar}
            />


            <Stack.Screen
                name="GrammarDetail"
                component={DetailGrammar}
            />
            <Stack.Screen
                name="Vocabulary"
                component={Vocabulary}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="FlashCard"
                component={FlashCard}
            />
            <Stack.Screen
                name="CourseViewer"
                component={CourseViewer}
            />

            <Stack.Screen
                name="Learning"
                component={Learning}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="QandA"
                component={QuestionListScreen}

            />

            <Stack.Screen name="CourseDetail" component={CourseDetail} />
            <Stack.Screen name="CourseHome" component={CourseHome} />

            <Stack.Screen
                name="Reading"
                options={({ route }) => ({
                    headerRight: () => <HeaderRight scrollRef={scrollRef} />,
                    title: "Reading Section",
                })}
            >
                {() => <Reading scrollRef={scrollRef} />}
            </Stack.Screen>
            <Stack.Screen name="PayWithBank" component={PayWithBank} />
            <Stack.Screen name="PayWithCard" component={PayWithCard} />
            <Stack.Screen name="Validation" component={CheckKey} />
            <Stack.Screen
                name="Notification"
                component={Notification}
            />
            <Stack.Screen
                name="Listening"
                component={ListeningExerciseScreen}
                options={{
                    headerRight: () => <HeaderRight scrollRef={scrollRef} />,
                }}
            />
            <Stack.Screen
                name="SectionRoot"
                component={SectionRoot}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen name="Speaking" component={SpeakingExercise} />
            <Stack.Screen name='Writing' component={WritingExercise} />




        </Stack.Navigator>
    );
}