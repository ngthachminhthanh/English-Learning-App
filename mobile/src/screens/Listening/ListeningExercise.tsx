import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';
import BottomNavigation from '../../components/QuestionNavigation';
import colors from '../../../colors';
import Section from "../../models/Section";
import sectionService from "../../services/section.service";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../type";
import { useFocusEffect } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { Input } from 'react-native-elements';
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import questionService from '../../services/question.service';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '../../utils/upload.util';
import * as FileSystem from 'expo-file-system';


const CONTENT_HEIGHT = 400;
const BOTTOM_NAV_HEIGHT = 80;

type ListeningExerciseProps = {
  scrollRef?: React.RefObject<ScrollView>;
};

export default function ListeningExerciseScreen() {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);
  const [questions, setQuestions] = useState<{ id: string; text: string; options: string[]; answered: boolean }[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const route = useRoute<RouteProp<RootStackParamList, "Reading">>();
  const { sectionID } = route.params;
  const [section, setSection] = useState<Section | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<any>(null);
  const [mcqText, setMcqText] = useState('');
  const [mcqChoices, setMcqChoices] = useState(['', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: string]: number }>({});

  // MCQ Edit Modal State
  const [showEditMcqModal, setShowEditMcqModal] = useState(false);
  const [editMcqId, setEditMcqId] = useState<string | null>(null);
  const [editMcqText, setEditMcqText] = useState('');
  const [editMcqChoices, setEditMcqChoices] = useState(['', '', '', '']);
  const [editMcqCorrect, setEditMcqCorrect] = useState<number | null>(null);

  const handleAddMcq = async () => {
    if (!mcqText.trim() || mcqChoices.some(c => !c.trim()) || mcqCorrect === null) {
      console.log('Please fill all fields and select the correct answer.');
      return;
    }
    try {
      const res = await questionService.createQuestionForSection({
        type: "MULTIPLE_CHOICE",
        sectionId: sectionID,
        question: mcqText,
        choices: mcqChoices,
        answer: mcqChoices[mcqCorrect]
      });
      const realId = res.data?.id
      setQuestions(prev => [
        ...prev,
        {
          id: realId,
          text: mcqText,
          options: mcqChoices,
          answered: false,
        }
      ]);
      setShowAddModal(false);
      setMcqText('');
      setMcqChoices(['', '', '', '']);
      setMcqCorrect(null);
    } catch (err) {
      console.log(err);
    }
  };

  // MCQ Edit/Remove
  const handleEditMcq = async () => {
    if (editMcqCorrect === null) return;
    try {
      await questionService.updateQuestion({
        questionId: editMcqId,
        text: editMcqText,
        choices: editMcqChoices,
        answer: editMcqChoices[editMcqCorrect]
      });
      setQuestions(prev =>
        prev.map(q =>
          q.id === editMcqId
            ? { ...q, text: editMcqText, options: editMcqChoices }
            : q
        )
      );
      setShowEditMcqModal(false); // Always close modal after update
    } catch (err) {
      console.log(err);
      // Optionally show error to user
      setShowEditMcqModal(false); // Still close modal on error
    }
  };

  const handleDeleteMcq = async (questionId: string) => {
    await questionService.deleteQuestion(questionId);
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const pickFile = async () => {
    try {

      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFileUrl(asset.uri);
        console.log('uri:', asset.uri);

        if (asset && asset.uri) {
          // Get file info
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          console.log('File info:', fileInfo);
          if (!fileInfo.exists || fileInfo.size === 0) {
            throw new Error('File does not exist or is empty');
          }
          if (fileInfo.size < 1000) {
            throw new Error(`File size too small (${fileInfo.size} bytes), likely corrupted`);
          }

          // Validate MIME type
          const extension = asset.name?.split('.').pop()?.toLowerCase() || '';
          const contentTypeMap = {
            m4a: 'audio/mp4',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
          };
          const mimeType =
            (extension in contentTypeMap
              ? contentTypeMap[extension as keyof typeof contentTypeMap]
              : undefined) ||
            asset.mimeType ||
            'application/octet-stream';
          if (!mimeType.startsWith('audio/')) {
            throw new Error(`Invalid MIME type: ${mimeType}`);
          }

          // Validate JPEG header (for JPEG files)
          if (mimeType === 'image/jpeg') {
            const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
              length: 2,
            });
            // Decode base64 to binary
            const binaryString = atob(fileContent);
            const bytes = new Uint8Array(binaryString.split('').map((c) => c.charCodeAt(0)));
            if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
              throw new Error('Invalid JPEG file: Missing SOI marker');
            }
            console.log('JPEG header validated successfully');
          }

          const key = await uploadFile(asset.uri, asset.name || 'image.jpg', mimeType, 'profile image file');
          const cloudfrontUrl = `https://d1fc7d6en42vzg.cloudfront.net/${key}`;
          console.log("key", key);
          await questionService.createQuestionForSection({
            "type": "LISTENING",
            "mp4Url": `https://d1fc7d6en42vzg.cloudfront.net/${key}`,
            "sectionId": sectionID
          });
          setFileUrl(cloudfrontUrl);
          setAudioUrl(cloudfrontUrl);

          // Read file content as Base64
          const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const byteArray = Uint8Array.from(atob(fileContent), (c) => c.charCodeAt(0));
          const blob = new Blob([byteArray], { type: mimeType });
          console.log('Blob size:', blob.size, 'File size:', fileInfo.size);
          if (blob.size !== fileInfo.size) {
            throw new Error(`Blob size (${blob.size} bytes) does not match file size (${fileInfo.size} bytes)`);
          }

          // Create File object
          // const file = new File([blob], asset.name || 'image', { type: mimeType });

          // // Save File to local storage for inspection
          // const localPath = `${FileSystem.documentDirectory}${asset.name || 'image.jpg'}`;
          // await FileSystem.writeAsStringAsync(localPath, fileContent, {
          //   encoding: FileSystem.EncodingType.Base64,
          // });
          // console.log('File saved locally:', localPath);
          // Alert.alert('File saved', `Saved to: ${localPath}`);

          // Set image as valid for rendering


          // Proceed with upload

          Alert.alert('Image uploaded successfully');
          Alert.alert('Image uploaded successfully');
        }
      } else {
        Alert.alert('No file selected');
      }
    } catch (err) {
      console.error('File pick or validation error:', err);

    }
  };

  // const pickFile = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: 'audio/*',
  //       copyToCacheDirectory: true,
  //       multiple: false,
  //     });
  //     if (result.assets && result.assets.length > 0) {
  //       setSelectedFile(result.assets[0]);
  //       setSelectedFileUrl(result.assets[0].uri);
  //       const asset = result.assets[0];
  //       if (asset && asset.uri) {
  //         const response = await fetch(asset.uri);
  //         const blob = await response.blob();
  //         const file = new File([blob], asset.name || "audio", { type: asset.mimeType || blob.type });
  //         const key = await uploadFile(file, "listening file");
  //         setFileUrl(`https://d1fc7d6en42vzg.cloudfront.net/${key}`);
  //         await questionService.createQuestionForSection({
  //           "type": "LISTENING",
  //           "mp4Url": `https://d1fc7d6en42vzg.cloudfront.net/${key}`,
  //           "sectionId": sectionID
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     console.log('File pick error:', err);
  //   }
  // };

  useEffect(() => {
    interface DecodedToken {
      [key: string]: any;
      "cognito:groups"?: string[];
      "username": string
    }

    const decodeTokenAndFetch = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode<DecodedToken>(token || "");
      const groups = decoded["cognito:groups"];
      setIsTeacher(groups?.includes("TEACHER"));

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "LISTENING"
        });
        if (result.statusCode === 201) {
          setAudioUrl(result.data[0]?.mp4Url || result.data[0]?.writtingPrompt);
        }
      } catch (error) {
        console.error("Error fetching listening audio:", error);
      }

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "MULTIPLE_CHOICE"
        });
        if (result.statusCode === 201) {
          setQuestions([
            ...result.data.map((q: any) => ({
              id: q.id || Math.random().toString(),
              text: q.text,
              options: q.choices,
              answered: false,
            }))
          ]);
        }
      } catch (error) {
        console.error("Error fetching MCQ:", error);
      }
    }
    decodeTokenAndFetch();
  }, []);

  // useEffect(() => {
  //   const fetchSection = async () => {
  //     try {
  //       const response = await sectionService.getSectionById(sectionID);
  //       setSection(response.data);
  //       if (response.data.questionGroups) {
  //         const allQuestions = response.data.questionGroups.flatMap((group: any) =>
  //           group.questions.map((q: any) => ({
  //             id: q.id,
  //             text: q.text,
  //             options: q.options,
  //             answered: false
  //           }))
  //         );
  //         setQuestions(allQuestions);
  //       }
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };

  //   fetchSection();
  // }, [sectionID]);

  useEffect(() => {
    const loadAudio = async () => {
      if (audioUrl) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false }
        );
        setSound(sound);

        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.durationMillis !== undefined) {
            setDuration(status.durationMillis / 1000);
          }
        }

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.positionMillis !== undefined) {
            setCurrentTime(status.positionMillis / 1000);
          }
        });
      }
    };

    loadAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUrl]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (sound) {
          sound.stopAsync();
        }
      };
    }, [sound])
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuestionChange = (questionIndex: number) => {
    setCurrentQuestion(questionIndex + 1);
  };

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleInputChange = (questionId: string, value: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === questionId ? { ...question, answered: !!value } : question
      )
    );
    if (value) {
      setAnsweredQuestions((prevAnswered) => [...prevAnswered, questionId]);
    } else {
      setAnsweredQuestions((prevAnswered) => prevAnswered.filter(id => id !== questionId));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.audioPlayer}>
        {isTeacher && (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: colors.blue1,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignSelf: "center",
                marginBottom: 16,
              }}
            onPress={pickFile}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Pick Audio File</Text>
            </TouchableOpacity>
            {selectedFile && (
              <Text style={{ textAlign: 'center', marginBottom: 8 }}>
                Selected: {selectedFile.name}
              </Text>
            )}
          </>
        )}
        <Text style={styles.playAudioText}>Play audio</Text>
        <View style={styles.playerControls}>
          <TouchableOpacity onPress={handlePlayPause}>
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color={colors.blue1}
            />
          </TouchableOpacity>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onValueChange={async (value) => {
              setCurrentTime(value);
              if (sound) {
                await sound.setPositionAsync(value * 1000);
              }
            }}
            minimumTrackTintColor="#6b4ce6"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#6b4ce6"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <ScrollView
        className="reading-exercise flex gap-4"
        ref={scrollViewRef}
      >
        {isTeacher && (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: colors.pink1,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignSelf: "center",
                marginBottom: 8,
              }}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Add Multiple Choice Question</Text>
            </TouchableOpacity>

            <Modal
              visible={showAddModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowAddModal(false)}
            >
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)'
              }}>
                <View style={{
                  backgroundColor: '#fff',
                  padding: 20,
                  borderRadius: 16,
                  width: '90%'
                }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Add Multiple Choice Question</Text>
                  <TextInput
                    placeholder="Question text"
                    value={mcqText}
                    onChangeText={setMcqText}
                    style={{
                      borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8
                    }}
                  />
                  {mcqChoices.map((choice, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <TouchableOpacity
                        style={{
                          width: 20, height: 20, borderRadius: 10, borderWidth: 1,
                          borderColor: mcqCorrect === idx ? colors.blue1 : '#ccc',
                          backgroundColor: mcqCorrect === idx ? colors.blue1 : '#fff',
                          marginRight: 8,
                          justifyContent: 'center', alignItems: 'center'
                        }}
                        onPress={() => setMcqCorrect(idx)}
                      >
                        {mcqCorrect === idx && <View style={{
                          width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff'
                        }} />}
                      </TouchableOpacity>
                      <TextInput
                        placeholder={`Choice ${idx + 1}`}
                        value={choice}
                        onChangeText={text => {
                          const newChoices = [...mcqChoices];
                          newChoices[idx] = text;
                          setMcqChoices(newChoices);
                        }}
                        style={{
                          flex: 1,
                          borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8
                        }}
                      />
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Button onPress={() => setShowAddModal(false)} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button mode="contained" onPress={handleAddMcq}>Add</Button>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}

        <View className="reading-questions" style={{ gap: 20, paddingHorizontal: 8 }}>
          {questions.length > 0 ? (
            questions.map((question, idx) => (
              <View
                key={question.id}
                style={{
                  marginBottom: 16,
                  backgroundColor: '#f8f8ff',
                  borderRadius: 14,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: colors.blue1 }}>
                  {idx + 1}. {question.text}
                </Text>
                {isTeacher && (
                  <View style={{ flexDirection: "row", marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{ marginRight: 12, padding: 4 }}
                      onPress={() => {
                        setEditMcqId(question.id);
                        setEditMcqText(question.text);
                        setEditMcqChoices([...question.options]);
                        setEditMcqCorrect(null);
                        setShowEditMcqModal(true);
                      }}
                    >
                      <Text style={{ color: colors.blue1, fontWeight: "bold" }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ padding: 4 }}
                      onPress={() => handleDeleteMcq(question.id)}
                    >
                      <Text style={{ color: colors.pink1, fontWeight: "bold" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {question.options && question.options.length > 0 ? (
                  question.options.map((option, oidx) => (
                    <TouchableOpacity
                      key={oidx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor:
                          selectedOptions[question.id] === oidx ? colors.pink1 : '#fff',
                        borderWidth: 1,
                        borderColor:
                          selectedOptions[question.id] === oidx ? colors.pink1 : '#e0e0e0',
                      }}
                      onPress={() =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [question.id]: oidx,
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          borderWidth: 2,
                          borderColor: colors.pink1,
                          marginRight: 12,
                          backgroundColor:
                            selectedOptions[question.id] === oidx ? colors.pink1 : '#fff',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedOptions[question.id] === oidx && (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: '#fff',
                            }}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          color: selectedOptions[question.id] === oidx ? '#fff' : '#333',
                        }}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Input
                    style={styles.input}
                    underlineColorAndroid="transparent"
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    onChangeText={(value) => handleInputChange(question.id, value)}
                    inputStyle={{ fontSize: 15, color: '#333' }}
                    placeholder="Type your answer"
                    containerStyle={{ marginTop: 8 }}
                  />
                )}
              </View>
            ))
          ) : (
            <Text>No questions available</Text>
          )}
        </View>

        {!isTeacher && (
          <TouchableOpacity
            onPress={() => { }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        )}

        {/* Edit Modal for MCQ */}
        <Modal visible={showEditMcqModal} transparent animationType="fade">
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <View style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "90%",
            }}>
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Edit Multiple Choice Question</Text>
              <TextInput
                placeholder="Edit question text"
                value={editMcqText}
                onChangeText={setEditMcqText}
                style={{
                  borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8
                }}
              />
              {editMcqChoices.map((choice, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <TouchableOpacity
                    style={{
                      width: 20, height: 20, borderRadius: 10, borderWidth: 1,
                      borderColor: editMcqCorrect === idx ? colors.blue1 : '#ccc',
                      backgroundColor: editMcqCorrect === idx ? colors.blue1 : '#fff',
                      marginRight: 8,
                      justifyContent: 'center', alignItems: 'center'
                    }}
                    onPress={() => setEditMcqCorrect(idx)}
                  >
                    {editMcqCorrect === idx && <View style={{
                      width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff'
                    }} />}
                  </TouchableOpacity>
                  <TextInput
                    placeholder={`Choice ${idx + 1}`}
                    value={choice}
                    onChangeText={text => {
                      const newChoices = [...editMcqChoices];
                      newChoices[idx] = text;
                      setEditMcqChoices(newChoices);
                    }}
                    style={{
                      flex: 1,
                      borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8
                    }}
                  />
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
                <Button onPress={() => setShowEditMcqModal(false)} style={{ marginRight: 8 }}>Cancel</Button>
                <Button mode="contained" onPress={handleEditMcq}>Save</Button>
                <Button mode="contained" color={colors.pink1} onPress={() => handleDeleteMcq(editMcqId!)} style={{ marginLeft: 8 }}>Delete</Button>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <BottomNavigation
        questions={questions}
        answeredQuestions={answeredQuestions}
        currentQuestion={currentQuestion}
        onQuestionChange={handleQuestionChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    height: CONTENT_HEIGHT,
  },
  scrollContent: {
    paddingBottom: BOTTOM_NAV_HEIGHT,
  },
  audioPlayer: {
    padding: 16,
  },
  readingContent: {
    flex: 1,
    alignItems: 'flex-start',
    marginVertical: 10,
    paddingHorizontal: 16,
    width: '100%'
  },
  playAudioText: {
    fontSize: 16,
    color: '#6b4ce6',
    marginBottom: 8,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  playbackSpeed: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionImage: {
    height: 240,
    width: 160,
    marginBottom: 10,
  },
  readingQuestions: {
    display: 'flex',
    gap: 20,
    paddingHorizontal: 16,
  },
  submitButton: {
    backgroundColor: colors.pink1,
    borderRadius: 30,
    padding: 16,
    alignSelf: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.pink1,
    borderRadius: 10,
    padding: 5,
    marginHorizontal: 5,
    maxWidth: 100,
    height: 20,
  }
});