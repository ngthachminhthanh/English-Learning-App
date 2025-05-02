import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { CheckBox , Icon} from "react-native-elements";

export default function VocabFrame({ word, onToggle }: { 
  word: VocabItem; 
  onToggle: () => void; 
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        backgroundColor: word.checked ? "#fcddec" : "#fff",
        borderColor: "#ef5da8",
        borderWidth: word.checked ? 1 : 0.5,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {word.showImage && (
        <Icon name="home" size={70} />
      )}
      <View>
        <Text style={{ fontWeight: "500", fontSize: 16 }}>{word.term}</Text>
        <Text style={{ color: "#555" }}>{word.translation}</Text>
      </View>

      <View style={{ marginLeft: "auto" }}>
        <CheckBox
          checked={word.checked}
          onPress={onToggle}
          checkedColor="#ef5da8"
          uncheckedColor="#ef5da8"
          containerStyle={{ padding: 0, margin: 0 }}
        />
      </View>
    </TouchableOpacity>
  );
}

export type VocabItem = {
  id: number;
  term: string;
  translation: string;
  checked: boolean;
  showImage?: boolean;
};
