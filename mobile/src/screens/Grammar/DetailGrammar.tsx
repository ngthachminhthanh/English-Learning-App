import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../type";
import RenderHTML from "react-native-render-html";
import {
  HTMLElementModel,
  defaultHTMLElementModels,
  HTMLContentModel,
} from "react-native-render-html";

type DetailGrammarRouteProp = RouteProp<RootStackParamList, "GrammarDetail">;

const { width } = Dimensions.get("window");

const grammarContentMock: Record<string, string> = {
  "1": `
    <h2>Present perfect tense</h2>
    <p>The present perfect is formed from the present tense of the verb have and the past participle of a verb.</p>
    <ul>
      <li>for something that started in the past and continues in the present: <br/>They’ve been married for nearly fifty years.</li>
      <li>when we are talking about our experience up to the present: <br/>I’ve seen that film before.</li>
    </ul>
    <p>He has written three books and he is working on another one.</p>
    <p>We often use the adverb ever to talk about experience: <br/>Have you ever met George?</p>
    <p>And we use never for the negative form: <br/>I’ve never met his wife.</p>
  `,
  "2": `<h2>If else condition</h2><p>Used to handle branching logic in programming based on a condition.</p>`,
  "3": `<h2>Passive voice</h2><p>Used when the focus is on the action, not who does it. E.g., "The cake was eaten."</p>`,
};

export default function DetailGrammar() {
  const route = useRoute<DetailGrammarRouteProp>();
  const { id } = route.params;

  const customHTMLElementModels = {
    ...defaultHTMLElementModels,
    iframe: HTMLElementModel.fromCustomModel({
      tagName: "iframe",
      mixedUAStyles: {
        width: "100%",
        height: 200,
      },
      contentModel: HTMLContentModel.block,
      isOpaque: true,
    }),
  };

  return (
    <ScrollView className="flex-1 w-full h-full">
      <View style={{ padding: 20 }}>
        <RenderHTML
          contentWidth={width}
          source={{ html: grammarContentMock[Number(id)] || "<p>No content found.</p>" }}
          customHTMLElementModels={customHTMLElementModels}
          ignoredDomTags={[]}
        />
      </View>
    </ScrollView>
  );
}
