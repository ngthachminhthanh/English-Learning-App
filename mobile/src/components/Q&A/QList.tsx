// components/Q&A/QuestionListScreen.js
import { View, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Text } from "react-native";
import React, { useState } from "react";
import QView from "./QView";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ImageSourcePropType } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { QScreenNavigationProp } from "../../type";
// Define navigation param list
type RootStackParamList = {
    CourseViewer: undefined;
    Learning: undefined;
    QuestionList: undefined;
    QuestionDetails: {
        user: { avatar: ImageSourcePropType; name: string; date: Date };
        title: string;
        question: string;
        answers: { user: { avatar: ImageSourcePropType; name: string; date: Date }; answer: string }[];
    };
};



type QuestionListScreenProps = {
    navigation: NativeStackScreenProps<RootStackParamList, "QuestionList">;
}

// Mock data
const mockQAData: {
    id: string;
    user: { avatar: ImageSourcePropType; name: string; date: Date };
    title: string;
    question: string;
    answers: { user: { avatar: ImageSourcePropType; name: string; date: Date }; answer: string }[];
}[] = [
        {
            id: "1",
            user: {
                avatar: { uri: "https://example.com/avatar1.jpg" },
                name: "Harry Potter",
                date: new Date("2024-02-20T14:12:00"),
            },
            title: "adjustment layers",
            question: "you can start using Material UI right away with minimal front-end infrastructure by installing it via CDN, which is a great option for rapid prototyping???",
            answers: [
                {
                    user: {
                        avatar: { uri: "https://example.com/avatar1.jpg" },
                        name: "Harry Potter",
                        date: new Date("2024-02-20T14:12:00"),
                    },
                    answer: "sure y can, it depends on your skill and visual taste",
                },
            ],
        },
        {
            id: "2",
            user: {
                avatar: { uri: "https://example.com/avatar2.jpg" },
                name: "Harry Potter",
                date: new Date("2024-02-20T14:12:00"),
            },
            title: "adjustment layers",
            question: "you can start using Material UI right away with minimal front-end infrastructure by installing it via CDN, which is a great option for rapid prototyping???",
            answers: [
                {
                    user: {
                        avatar: { uri: "https://example.com/avatar2.jpg" },
                        name: "Harry Potter",
                        date: new Date("2024-02-20T14:12:00"),
                    },
                    answer: "Answer 1",
                },
                {
                    user: {
                        avatar: { uri: "https://example.com/avatar2.jpg" },
                        name: "Harry Potter",
                        date: new Date("2024-02-20T14:12:00"),
                    },
                    answer: "Answer 2",
                },
            ],
        },
    ];

const QuestionListScreen = () => {
    const navigation = useNavigation<QScreenNavigationProp>();
    const [modalVisible, setModalVisible] = useState(false);
    const [newQuestionTitle, setNewQuestionTitle] = useState("");
    const [newQuestionDetails, setNewQuestionDetails] = useState("");
    const [questions, setQuestions] = useState(mockQAData);

    const handlePostQuestion = () => {
        if (newQuestionTitle && newQuestionDetails) {
            const newQuestion = {
                id: (questions.length + 1).toString(),
                user: {
                    avatar: { uri: "https://example.com/avatar1.jpg" },
                    name: "Harry Potter",
                    date: new Date(),
                },
                title: newQuestionTitle,
                question: newQuestionDetails,
                answers: [],
            };
            setQuestions([newQuestion, ...questions]);
            setNewQuestionTitle("");
            setNewQuestionDetails("");
            setModalVisible(false);
        }
    };

    const renderItem = ({ item }: {
        item: {
            id: string;
            user: { avatar: ImageSourcePropType; name: string; date: Date };
            title: string;
            question: string;
            answers: { user: { avatar: ImageSourcePropType; name: string; date: Date }; answer: string }[];
        };
    }) => (
        <QView
            user={item.user}
            title={item.title}
            question={item.question}
            answers={item.answers}
            onPress={() =>
                navigation.navigate("QuestionDetails", {
                    user: item.user,
                    title: item.title,
                    question: item.question,
                    answers: item.answers,
                })
            }
        />
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={questions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Post a question</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={newQuestionTitle}
                            onChangeText={setNewQuestionTitle}
                        />
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Details"
                            value={newQuestionDetails}
                            onChangeText={setNewQuestionDetails}
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Cancel" onPress={() => setModalVisible(false)} />
                            <Button title="Post" onPress={handlePostQuestion} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    list: {
        padding: 16,
    },
    fab: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#E91E63",
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    fabText: {
        color: "#fff",
        fontSize: 24,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
});

export default QuestionListScreen