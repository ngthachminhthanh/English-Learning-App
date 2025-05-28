import React, { useState, useEffect } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Searchbar } from 'react-native-paper';
import NotiComponent from '../../components/Notification';
import { useRoute } from '@react-navigation/native';

const Notification = () => {
  const route = useRoute();
  // Get wordList from params
  const wordList = (route.params as { wordList?: any[] })?.wordList || [];
  const defaultNotifications = [
    { id: 1, text: 'It’s time to complete your daily exercise!', isRead: false, time: '1 minute ago' },
    { id: 2, text: 'It’s time to complete your daily exercise!', isRead: true, time: '' },
  ];

  // Convert wordList to notifications
  const initialNotifications = [
    ...defaultNotifications,
    ...wordList.map((word, idx) => ({
      id: word.id ?? idx + 1000, // avoid id collision with default
      text: `Unlearnt: ${word.term} - ${word.translation}`,
      isRead: false,
      time: 'Just now',
    })),
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(initialNotifications);

  // Mark as read when pressed
  const handlePress = (id: number) => {
    setNotifications(prev =>
      prev.map(noti =>
        noti.id === id ? { ...noti, isRead: true } : noti
      )
    );
  };

  // If wordList changes, update notifications (always include default)
  useEffect(() => {
    setNotifications([
      ...defaultNotifications,
      ...wordList.map((word, idx) => ({
        id: word.id ?? idx + 1000,
        text: `Unlearnt: ${word.term} - ${word.translation}`,
        isRead: false,
        time: 'Just now',
      })),
    ]);
  }, [wordList]);

  return (
    <View>

      <ScrollView className='px-5 mt-[20px]'>
        {notifications
          .filter(noti => noti.text.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handlePress(notification.id)}
              style={{
                backgroundColor: notification.isRead ? '#f0f0f0' : '#E4E2FC', // gray for read, pink for unread
                borderRadius: 10,
                marginBottom: 10,
              }}
              activeOpacity={0.7}
            >
              <NotiComponent
                text={notification.text}
                isRead={notification.isRead}
                time={notification.time}
              />
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
};

export default Notification;