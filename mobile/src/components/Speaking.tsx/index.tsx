import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as FileSystem from 'expo-file-system';
import colors from '../../../colors';
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import questionService from '../../services/question.service';
import { useRoute } from '@react-navigation/native';

export default function SpeakingExercise() {
  const [isTeacher, setIsTeacher] = useState<boolean>()
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState("");
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState("");
  const [questionId, setQuestionId] = useState<string | null>(null);
  const route = useRoute<any>()
  const { sectionID } = route.params || {};

  useEffect(() => {
    interface DecodedToken {
      [key: string]: any;
      "cognito:groups"?: string[];
      "username": string
    }

    const decodeTokenAndFetch = async () => {
      // 1. Decode token and set isTeacher
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode<DecodedToken>(token || "");
      const groups = decoded["cognito:groups"];
      const username = decoded["username"]

      setIsTeacher(groups?.includes("TEACHER"));
      console.log(decoded);
      console.log(groups?.includes("TEACHER"));

      try {
        const result = await questionService.getQuestionBySection({
          "sectionId": sectionID,
          "type": "SPEAKING_QUESTION"
        });
        console.log("result", result);

        if (result.statusCode === 201) {
          setQuestion(result.data[0]?.speakingPrompt);
          setQuestionId(result.data[0]?.id);
        } else {
          console.error(
            "Error fetching course categories, status code: ",
            result.statusCode
          );
        }
      } catch (error) {
        console.error("Error fetching course categories:", error);
      }
      // 2. Fetch course categories

    }
    decodeTokenAndFetch();
  }, []);
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [recording, sound]);

  const handleAddQuestion = async () => {
    await questionService.createQuestionForSection({
      "type": "SPEAKING_QUESTION",
      "speakingPrompt": newQuestion,
      "sectionId": sectionID
    })
    setQuestion(newQuestion);
    setShowAddModal(false);
    setNewQuestion("");
  };

  const handleEditQuestion = async () => {
    if (!questionId) return;
    await questionService.updateQuestion({
      questionId,
      speakingPrompt: editQuestion,
    });
    setQuestion(editQuestion);
    setShowEditModal(false);
  };

  // Delete handler
  const handleDeleteQuestion = async () => {
    if (!questionId) return;
    await questionService.deleteQuestion({ questionId });
    setQuestion("");
    setQuestionId(null);
    setShowEditModal(false);
  };

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) {
      return;
    }

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingUri(uri);
    setRecording(null);
    console.log('Recording saved at', uri);
  }

  async function playRecording() {
    if (!recordingUri) {
      return;
    }

    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
    setSound(sound);
    setIsPlaying(true);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        if (status.durationMillis) {
          setProgress(status.positionMillis / status.durationMillis);
        }
        if (status.durationMillis !== undefined) {
          setDuration(status.durationMillis);
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      }
    });
  }

  async function pauseRecording() {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }

  async function replayRecording() {
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
      setIsPlaying(true);
    }
  }

  async function saveRecording() {
    if (!recordingUri) {
      Alert.alert('No recording to save');
      return;
    }

    try {
      const destPath = `${FileSystem.documentDirectory}recording.mp3`;
      await FileSystem.copyAsync({
        from: recordingUri,
        to: destPath,
      });
      setSavedFilePath(destPath);
      console.log('Recording saved', `File saved to: ${destPath}`);

      // Read the file as a binary string
      const fileData = await FileSystem.readAsStringAsync(destPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Post the file to the backend API
      const response = await fetch('https://your-backend-api.com/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'recording.mp3',
          fileData: fileData,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Recording uploaded successfully');
      } else {
        Alert.alert('Error', 'Failed to upload recording');
      }
    } catch (error) {
      console.error('Error saving recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  }

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>

      {isTeacher && (
        <TouchableOpacity
          style={{
            backgroundColor: colors.blue1,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            alignSelf: "center",
            marginBottom: 16,
          }}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add Question</Text>
        </TouchableOpacity>
      )}

      {isTeacher && questionId && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}>
          <TouchableOpacity
            style={{ marginRight: 12, padding: 4 }}
            onPress={() => {
              setEditQuestion(question);
              setShowEditModal(true);
            }}
          >
            <Icon name="edit" size={20} color={colors.blue1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ padding: 4 }}
            onPress={handleDeleteQuestion}
          >
            <Icon name="trash" size={20} color={colors.pink1} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text className='font-sans text-header-2' style={styles.title}>Speaking Exercise</Text>
        <Text className='font-sans text-body' style={styles.question}>{question}</Text>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.recordButton}
        >
          {isRecording ? (
            <Icon name="stop" size={32} color="white" />
          ) : (
            <Icon name="microphone" size={32} color="white" />
          )}
        </TouchableOpacity>
        <Text style={styles.recordingText}>
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </Text>

        {recordingUri && (
          <View>
            <Slider
              value={progress}
              onValueChange={(value: number) => {
                if (sound) {
                  sound.setPositionAsync(value * duration);
                }
              }}
              style={styles.slider}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(progress * duration)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={isPlaying ? pauseRecording : playRecording}
                style={styles.playButton}
              >

                {isPlaying ? (
                  <Icon name="pause" size={24} color={colors.blue2} />
                ) : (
                  <Icon name="play" size={24} color={colors.blue2} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={replayRecording}
                style={styles.replayButton}
              >
                <Icon name="repeat" size={24} color={colors.blue2} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={saveRecording}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={showAddModal} transparent animationType="fade">
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
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Add New Speaking Question</Text>
            <TextInput
              placeholder="Enter speaking question"
              value={newQuestion}
              onChangeText={setNewQuestion}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: "#eee",
                borderRadius: 8,
                marginRight: 8,
              }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddQuestion} style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: colors.blue1,
                borderRadius: 8,
              }}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade">
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
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Edit Speaking Question</Text>
            <TextInput
              placeholder="Enter speaking question"
              value={editQuestion}
              onChangeText={setEditQuestion}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: "#eee",
                borderRadius: 8,
                marginRight: 8,
              }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditQuestion} style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: colors.blue1,
                borderRadius: 8,
              }}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
  },
  card: {
    backgroundColor: colors.pink4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.blue1,
    paddingTop: 16,
    fontFamily: 'WorkSans_400Regular',
  },
  question: {
    marginBottom: 24,
    textAlign: 'center',
  },
  recordButton: {
    backgroundColor: colors.blue1,
    borderRadius: 50,
    padding: 16,
    paddingLeft: 20,
    paddingRight: 20,
    alignSelf: 'center',
  },
  recordingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#888',
  },
  playButton: {
  },
  slider: {
    marginTop: 32,
    color: colors.blue1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#888',
  },
  replayButton: {
    alignSelf: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});