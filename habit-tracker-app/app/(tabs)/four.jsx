import { Calendar } from 'react-native-calendars';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const auth = getAuth();
  const user = auth.currentUser;
  const habitCollection = collection(db, 'habits');

  const todayDate = new Date();
  const formattedDate = todayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (user) {
      fetchCompletedHabitDates();
    }
  }, [user]);

  const fetchCompletedHabitDates = async () => {
    
    try {
      const q = query(habitCollection, where("userId", "==", user.uid));
      const data = await getDocs(q);
      const habits = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      const completedDatesMap = {};

      habits.forEach(habit => {
        if (Array.isArray(habit.completionLog)) {
          habit.completionLog.forEach(date => {
            completedDatesMap[date] = {
              marked: true,
              dotColor: '#FFA726',
            };
          });
        }
      });

      setMarkedDates(completedDatesMap);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Select a Date</Text>
        <Calendar
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: '#5C6BC0',
            todayTextColor: '#FFA726',
            arrowColor: '#5C6BC0',
            monthTextColor: '#5C6BC0',
            textDayFontWeight: 'bold',
          }}
        />
        <Text style={styles.selectedDateText}>
          {selectedDate
            ? `You selected: ${selectedDate}`
            : 'No date selected'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f3ff', // pastel blue background
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#5C6BC0',
    textAlign: 'center',
  },
  selectedDateText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});