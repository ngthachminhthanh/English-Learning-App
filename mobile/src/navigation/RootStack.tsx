import { createStackNavigator } from "@react-navigation/stack";
import { useRef } from "react";
import { ScrollView } from "react-native-gesture-handler";
import Learning from "../screens/Learning";


export default function RootStack() {
    const Stack = createStackNavigator();
    const scrollRef = useRef<ScrollView>(null);
    return (
        <Stack.Navigator>

            <Stack.Screen
                name="Learning"
                component={Learning}
                options={{ headerShown: false }}
            />

        </Stack.Navigator>
    );
}