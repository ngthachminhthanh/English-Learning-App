import { createStackNavigator } from "@react-navigation/stack";
import { useRef } from "react";
import { ScrollView } from "react-native-gesture-handler";
import Learning from "../screens/Learning";
import CourseViewer from "../components/CourseHome";
import { QuestionListScreen } from "../components/Q&A";


export default function RootStack() {
    const Stack = createStackNavigator();
    const scrollRef = useRef<ScrollView>(null);
    return (
        <Stack.Navigator initialRouteName="CourseViewer">
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