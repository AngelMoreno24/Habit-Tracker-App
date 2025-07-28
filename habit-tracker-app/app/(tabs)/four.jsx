import { Calendar } from 'react-native-calendars';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  View,
  FlatList,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function CalendarScreen() {
  const [habits, setHabits] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const auth = getAuth();
  const user = auth.currentUser;
  const habitCollection = collection(db, 'habits');

  const weekdayFromDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formattedDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  useEffect(() => {
    if (user) {
      fetchCompletedHabitDates();
    }
  }, [user]);

  const fetchCompletedHabitDates = async () => {
    try {
      const q = query(habitCollection, where("userId", "==", user.uid));
      const data = await getDocs(q);
      const allHabits = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      const completedDatesMap = {};

      allHabits.forEach(habit => {
        if (Array.isArray(habit.completionLog)) {
          habit.completionLog.forEach(dateString => {
            completedDatesMap[dateString] = {
              marked: true,
              dotColor: '#5C6BC0',
            };
          });
        }
      });

      setMarkedDates(completedDatesMap);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  useEffect(() => {
    if (user && selectedDate) {
      fetchHabitsByDate(selectedDate);
    }
  }, [selectedDate, user]);

  const fetchHabitsByDate = async (date) => {
    try {
      const dayAbbrev = weekdayFromDate(date).slice(0, 3);
      const selected = date;

      const dailyQuery = query(
        habitCollection,
        where('userId', '==', user.uid),
        where('frequency', '==', 'daily')
      );
      const dailySnap = await getDocs(dailyQuery);
      const dailyHabits = dailySnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      const weeklyQuery = query(
        habitCollection,
        where('userId', '==', user.uid),
        where('frequency', '==', 'weekly'),
        where('days', 'array-contains', dayAbbrev)
      );
      const weeklySnap = await getDocs(weeklyQuery);
      const weeklyHabits = weeklySnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      const isWithinLifetime = (habit) => {
        const createdAtStr = habit.createdAt || null;
        const stoppedAtStr = habit.stoppedAt || null;
        const afterCreated = !createdAtStr || selected >= createdAtStr;
        const beforeStopped = !stoppedAtStr || selected <= stoppedAtStr;
        return afterCreated && beforeStopped;
      };

      const filteredDaily = dailyHabits.filter(isWithinLifetime);
      const filteredWeekly = weeklyHabits.filter(isWithinLifetime);

      setHabits([...filteredDaily, ...filteredWeekly]);
    } catch (error) {
      console.error('Error fetching habits by date:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Select a Date</Text>
        <Calendar
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={{
            ...markedDates,
            ...(selectedDate && {
              [selectedDate]: {
                ...(markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: '#74A3FF',
              },
            }),
          }}
          theme={{
            selectedDayBackgroundColor: '#74A3FF',
            todayTextColor: '#FFA726',
            arrowColor: '#74A3FF',
            monthTextColor: '#2a3a99',
            textDayFontWeight: 'bold',
            textSectionTitleColor: '#2a3a99',
          }}
        />

        <Text style={styles.selectedDateText}>
          {selectedDate
            ? `Habits for ${formattedDate(selectedDate)} (${weekdayFromDate(selectedDate)})`
            : 'No date selected'}
        </Text>

        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            selectedDate ? (
              <Text style={styles.noHabitsText}>No habits scheduled for this day.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.habitName}>{item.name}</Text>
              <Text style={styles.habitFrequency}>
                {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)} Habit
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DCEEFB',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
    textAlign: 'center',
  },
  selectedDateText: {
    marginTop: 16,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  noHabitsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#A6C8FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  habitName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: 6,
  },
  habitFrequency: {
    fontSize: 14,
    fontWeight: '500',
    color: '#74A3FF',
  },
});