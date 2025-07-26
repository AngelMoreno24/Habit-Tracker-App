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

  // Convert YYYY-MM-DD to weekday name
  const weekdayFromDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formattedDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
            // No time comparison needed since completionLog dates stored as strings YYYY-MM-DD
            completedDatesMap[dateString] = {
              marked: true,
              dotColor: '#5C6BC0',  // pastel blue dot
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
      const dayAbbrev = weekdayFromDate(date).slice(0, 3); // e.g., "Mon"
      const selected = date; // date is string "YYYY-MM-DD"

      // Daily habits query
      const dailyQuery = query(
        habitCollection,
        where('userId', '==', user.uid),
        where('frequency', '==', 'daily')
      );
      const dailySnap = await getDocs(dailyQuery);
      const dailyHabits = dailySnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Weekly habits query
      const weeklyQuery = query(
        habitCollection,
        where('userId', '==', user.uid),
        where('frequency', '==', 'weekly'),
        where('days', 'array-contains', dayAbbrev)
      );
      const weeklySnap = await getDocs(weeklyQuery);
      const weeklyHabits = weeklySnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Filter by createdAt and stoppedAt date strings
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
                selectedColor: '#5C6BC0',
              },
            }),
          }}
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
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  noHabitsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#dde6fd', // lighter pastel blue
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#5C6BC0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  habitName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2a3a99',
    marginBottom: 6,
  },
  habitFrequency: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5C6BC0',
  },
});