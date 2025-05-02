import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Button, IconButton, ProgressBar } from "react-native-paper";
import { useRoute } from "@react-navigation/native";

const { height, width } = Dimensions.get("window");

type VocabItem = {
  id: number;
  term: string;
  translation: string;
  checked: boolean;
};

const FlashCard = () => {
  const route = useRoute();
  const { wordList } = route.params as { wordList: VocabItem[] };

  const [color, setColor] = useState("#5D5FEF");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const flipCard = () => {
    if (flipped) {
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        useNativeDriver: true,
      }).start();
    }
    setFlipped(!flipped);
  };

  const handleNext = () => {
    if (currentIndex < wordList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSwapColor = () => {
    setColor(color === "#5D5FEF" ? "#FF00FF" : "#5D5FEF");
  };

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  } as Animated.AnimatedProps<any>;

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  } as Animated.AnimatedProps<any>;

  const word = wordList[currentIndex];

  return (
    <View className="items-center flex bg-[#F5F5F5]" style={{ width, height }}>
      {/* Header */}
      <View
        className="w-full h-[120px] rounded-bl-3xl rounded-br-3xl"
        style={{ backgroundColor: color }}
      >
        <View className="flex flex-row items-center mt-5 ml-2">
          <IconButton icon="arrow-left" size={32} iconColor="white" />
          <Text className="text-white text-3xl font-semibold">Vocabulary</Text>
        </View>
      </View>

      {/* Flash Card */}
      <TouchableWithoutFeedback onPress={flipCard}>
        <View
          className="absolute z-[2] bg-white rounded-3xl items-center justify-center"
          style={{ width: width - 80, top: 70, height: height - 500 }}
        >
          {/* Icons */}
          <View className="flex-row justify-between w-full absolute top-2 px-2">
            <IconButton icon="repeat" size={24} onPress={handleSwapColor} />
            <IconButton icon="star-outline" size={24} onPress={() => {}} />
          </View>

          {/* Front Side */}
          <Animated.View
            className="absolute items-center justify-center w-full h-full"
            style={[frontAnimatedStyle, { backfaceVisibility: "hidden" }]}
          >
            <Text className="text-black text-2xl font-medium text-center">
              {word.term}
            </Text>
          </Animated.View>

          {/* Back Side */}
          <Animated.View
            className="absolute items-center justify-center w-full h-full"
            style={[
              backAnimatedStyle,
              { position: "absolute", top: 0, backfaceVisibility: "hidden" },
            ]}
          >
            <Text className="text-black text-2xl font-medium text-center">
              {word.translation}
            </Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* Progress */}
      <View className="mt-[400]">
        <ProgressBar
          progress={(currentIndex + 1) / wordList.length}
          color={color}
          style={styles.progressBar}
        />
        <Text className="text-black text-base font-medium">
          {currentIndex + 1}/{wordList.length}
        </Text>
      </View>

      {/* Next Button */}
      <Button
        mode="contained"
        buttonColor={color}
        style={styles.button}
        className="mt-[30px]"
        children="NEXT CARD"
        onPress={handleNext}
        labelStyle={styles.label}
        disabled={currentIndex === wordList.length - 1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    width: width - 80,
    height: 30,
    backgroundColor: "#d3d3d3",
    borderRadius: 50,
  },
  label: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
  },
  button: {
    width: width - 80,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FlashCard;
