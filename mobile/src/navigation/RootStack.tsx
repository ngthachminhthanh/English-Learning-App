import { createStackNavigator } from "@react-navigation/stack";
import { useRef } from "react";
import { ScrollView } from "react-native-gesture-handler";
import Learning from "../screens/Learning";
import CourseViewer from "../components/CourseHome";
import Vocabulary from "../screens/Vocabulary";
import FlashCard from "../screens/FlashCard";
import Grammar from "../screens/Grammar";
import DetailGrammar from "../screens/Grammar/DetailGrammar";
import { QuestionListScreen } from "../components/Q&A";


export default function RootStack() {
    const Stack = createStackNavigator();
    const scrollRef = useRef<ScrollView>(null);
    return (
        <Stack.Navigator initialRouteName="Learning">

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



        </Stack.Navigator>
    );
}