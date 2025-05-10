// components/Q&A/QView.js
import { Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { UserPostHeader } from ".";
import Question from "./Question";
import { ImageSourcePropType } from "react-native";

interface QViewProps {
  user: { avatar: ImageSourcePropType; name: string; date: Date };
  title: string;
  question: string;
  answers: { user: { avatar: ImageSourcePropType; name: string; date: Date }; answer: string }[];
  onPress: () => void; // Callback for navigation
}

const QView: React.FC<QViewProps> = ({ user, title, question, answers, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 16 }}>
      <UserPostHeader avatar={user.avatar} name={user.name} date={user.date} />
      <Question title={title} question={question} />
      <Text className="text-[14px] font-normal text-[#5D5FEF]">
        {answers.length === 1 ? "1 response" : `${answers.length} responses`}
      </Text>
    </TouchableOpacity>
  );
};

export default QView;