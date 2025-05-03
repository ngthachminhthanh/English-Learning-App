import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { GrammarScreenNavigationProp } from "../../type";
import GrammarModel from "../../models/GrammarModel";
import MainHeader from "../../components/MainHeader";

const mockGrammars: GrammarModel[] = [
  { id: "1", title: "Present perfect tense", description: "" },
  { id: "2", title: "If else condition", description: "" },
  { id: "3", title: "Passive voice", description: "" },
];

const Grammar = () => {
  const [grammars] = useState<GrammarModel[]>(mockGrammars);
  const navigation = useNavigation<GrammarScreenNavigationProp>();

  const renderItem = ({ item }: { item: GrammarModel }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("GrammarDetail", { id: item.id })}
      style={styles.card}
    >
      <Text style={styles.title}>▶ {item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MainHeader />
      <View style={{ flex: 1, padding: 10 }}>
        <FlatList
          data={grammars}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default Grammar;
