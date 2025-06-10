import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert, TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

import colors from '../../../colors';
import { RootStackParamList } from '../../type';
import questionService from '../../services/question.service';
import studentAnswerService from '../../services/studentAnswer';
import * as DocumentPicker from 'expo-document-picker';

const ListeningExerciseScreen = () => {
  const [audioUrl, setAudioUrl] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: string]: number }>({});
  const [isTeacher, setIsTeacher] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const route = useRoute<RouteProp<RootStackParamList, 'Reading'>>();
  const sectionID = route.params.sectionID;

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      const decoded = jwtDecode<any>(token || '');
      setIsTeacher(decoded['cognito:groups']?.includes('TEACHER'));

      try {
        const statusRes = await studentAnswerService.getSubmissionStatus(sectionID, token!);
        setIsSubmitted(statusRes.submitted);
        setScore(statusRes.score ?? null);
      } catch (err) {
        console.error('Failed to check submission status', err);
      }

      const mcqRes = await questionService.getQuestionBySection({
        sectionId: sectionID,
        type: 'MULTIPLE_CHOICE',
      });
      setQuestions(mcqRes.data);

      const audioRes = await questionService.getQuestionBySection({
        sectionId: sectionID,
        type: 'LISTENING',
      });
      setAudioUrl(audioRes.data?.[0]?.mp4Url ?? '');
    };

    initialize();
  }, []);

  const handleSubmit = async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    const answers = Object.entries(selectedOptions).map(([questionId, index]) => {
      const question = questions.find(q => q.id === questionId);
      return {
        questionId,
        type: 'MULTIPLE_CHOICE',
        answer: question?.choices[index],
      };
    });

    try {
      await studentAnswerService.submitAnswers({ sectionId: sectionID, answers }, token!);
      setIsSubmitted(true);

      let correctCount = 0;
      questions.forEach(q => {
        const selectedIndex = selectedOptions[q.id];
        const selectedAnswer = q.choices[selectedIndex];
        if (selectedAnswer === q.answer) {
          correctCount += 1;
        }
      });

      setScore(correctCount);
      Alert.alert('Submitted!', `You scored ${correctCount}/${questions.length}`);
    } catch (error) {
      Alert.alert('Submission Failed', 'Something went wrong.');
      console.error(error);
    }
  };

  const pickAudioFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!result.canceled && result.assets.length > 0) {
      setAudioUrl(result.assets[0].uri);
      await questionService.createQuestionForSection({
        sectionId: sectionID,
        type: 'LISTENING',
        mp4Url: result.assets[0].uri,
      });
    }
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion.trim() || correctAnswerIndex === null || options.some(o => !o.trim())) return;

    try {
      if (editIndex !== null) {
        const editing = questions[editIndex];
        await questionService.updateQuestion({
          questionId: editing.id,
          text: newQuestion,
          choices: options,
          answer: options[correctAnswerIndex],
        });
      } else {
        await questionService.createQuestionForSection({
          sectionId: sectionID,
          type: 'MULTIPLE_CHOICE',
          text: newQuestion,
          choices: options,
          answer: options[correctAnswerIndex],
        });
      }

      setNewQuestion('');
      
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(null);
      setEditIndex(null);
      const updated = await questionService.getQuestionBySection({
        sectionId: sectionID,
        type: 'MULTIPLE_CHOICE',
      });
      setQuestions(updated.data);
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleEdit = (index: number) => {
    const q = questions[index];
    setNewQuestion(q.text);
    setOptions(q.choices);
    setCorrectAnswerIndex(q.choices.findIndex((opt: string) => opt === q.answer));
    setEditIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Listening Section</Text>
      {audioUrl ? <AudioPlayer url={audioUrl} /> : <Text>No Audio Available</Text>}

      {isTeacher && (
        <View>
          <TouchableOpacity style={styles.button} onPress={pickAudioFile}>
            <Text style={styles.buttonText}>Chọn Audio</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView>
        {questions.map((q, index) => (
          <View key={q.id} style={styles.questionBox}>
            <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
            {q.choices.map((choice: string, i: number) => {
              const isSelected = selectedOptions[q.id] === i;
              const isCorrect = q.answer === choice;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedOptions(prev => ({ ...prev, [q.id]: i }))}
                  disabled={isSubmitted || isTeacher}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    isSubmitted && isCorrect && styles.optionCorrect,
                    isSubmitted && isSelected && !isCorrect && styles.optionIncorrect,
                  ]}
                >
                  <Text>{String.fromCharCode(65 + i)}. {choice}</Text>
                </TouchableOpacity>
              );
            })}
            {isTeacher && (
              <TouchableOpacity onPress={() => handleEdit(index)}>
                <Text style={styles.editText}>Chỉnh sửa</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {!isTeacher && !isSubmitted && (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      )}

      {isSubmitted && score !== null && (
        <Text style={styles.score}>Your score: {score}/{questions.length}</Text>
      )}

      {isTeacher && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi"
            value={newQuestion}
            onChangeText={setNewQuestion}
          />
          {options.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <TouchableOpacity onPress={() => setCorrectAnswerIndex(i)} style={styles.radioCircle}>
                <View style={[styles.innerCircle, correctAnswerIndex === i && styles.radioChecked]} />
              </TouchableOpacity>
              <TextInput
                style={styles.optionInput}
                placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChangeText={text => {
                  const newOpts = [...options];
                  newOpts[i] = text;
                  setOptions(newOpts);
                }}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={handleSaveQuestion}>
            <Text style={styles.buttonText}>{editIndex !== null ? 'Lưu chỉnh sửa' : 'Thêm câu hỏi'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const AudioPlayer = ({ url }: { url: string }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(1);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false },
        status => {
          if (!isMounted) return;
          if (status.isLoaded) {
            setDuration(status.durationMillis || 1);
            setPosition(status.positionMillis || 0);
            setIsPlaying(status.isPlaying);
          }
        }
      );
      setSound(sound);
    };

    loadSound();
    return () => {
      isMounted = false;
      if (sound) sound.unloadAsync();
    };
  }, [url]);

  const togglePlay = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  const onSlide = async (value: number) => {
    if (sound) await sound.setPositionAsync(value);
  };

  const formatMillis = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={{ marginVertical: 12 }}>
      <TouchableOpacity onPress={togglePlay} style={styles.button}>
        <Text style={styles.buttonText}>{isPlaying ? '⏸ Pause' : '▶️ Play Audio'}</Text>
      </TouchableOpacity>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={onSlide}
        minimumTrackTintColor={colors.blue1}
        maximumTrackTintColor="#000000"
      />
      <Text style={{ textAlign: 'center', color: '#555' }}>
        {formatMillis(position)} / {formatMillis(duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  questionBox: { marginBottom: 16, borderBottomWidth: 1, paddingBottom: 8 },
  questionText: { fontWeight: '600' },
  option: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 6,
  },
  optionSelected: { backgroundColor: '#f2d4eb', borderColor: '#d63384' },
  optionCorrect: { borderColor: 'green', backgroundColor: '#d4f2d4' },
  optionIncorrect: { borderColor: 'red', backgroundColor: '#f8d7da' },
  button: {
    backgroundColor: colors.pink1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  score: { fontSize: 18, textAlign: 'center', marginTop: 12, color: '#4caf50' },
  audioButton: { fontSize: 16, color: colors.blue1, textAlign: 'center', marginVertical: 10 },
  form: { marginTop: 20, borderTopWidth: 1, borderColor: '#ccc', paddingTop: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#777', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  innerCircle: { height: 10, width: 10, borderRadius: 5 },
  radioChecked: { backgroundColor: colors.pink1 },
  optionInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 8 },
  editText: { color: colors.blue1, marginTop: 6 },
});

export default ListeningExerciseScreen;
