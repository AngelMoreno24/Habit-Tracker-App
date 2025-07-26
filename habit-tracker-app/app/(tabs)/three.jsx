import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  SafeAreaView,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function ViewScreen() {
  const [habits, setHabits] = useState([]);
  const [username, setUsername] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const habitCollection = collection(db, 'habits');

  const todayDate = new Date();
  const todayString = todayDate.toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[todayDate.getDay()];
  const formattedDate = todayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (user) {
      fetchTodayHabits();
    }
  }, [user]);

  const fetchTodayHabits = async () => {
    if (!user) return;

    try {
      const dailyQuery = query(
        habitCollection,
        where('userId', '==', user.uid),
        where('frequency', '==', 'daily')
      );
      const dailySnap = await getDocs(dailyQuery);
      const dailyHabits = dailySnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const weeklyQuery = query(
        habitCollection,
        where('userId', '==', user.uid),
        where('frequency', '==', 'weekly'),
        where('days', 'array-contains', currentDayName.slice(0, 3))
      );
      const weeklySnap = await getDocs(weeklyQuery);
      const weeklyHabits = weeklySnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      setHabits([...dailyHabits, ...weeklyHabits]);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const toggleCompletion = async (habit) => {
    const ref = doc(db, 'habits', habit.id);
    const log = habit.completionLog || [];
    const alreadyDone = log.includes(todayString);

    const newLog = alreadyDone
      ? log.filter((d) => d !== todayString)
      : [...log, todayString];

    await updateDoc(ref, { completionLog: newLog });
    fetchTodayHabits();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.greeting}>View Habits</Text>
        <Text style={styles.dateText}>Today: {formattedDate}</Text>

        <View style={styles.divider} />

        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const done = item.completionLog?.includes(todayString);
            return (
              <View style={styles.habitRow}>
                <Text style={[styles.habitText, done && styles.habitTextDone]} numberOfLines={1}>
                  {item.name}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleCompletion(item)}
                  style={[styles.toggleButton, done ? styles.doneButton : styles.undoneButton]}
                >
                  <Text style={styles.buttonText}>{done ? 'Undo' : 'Done'}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DCEEFB', // pastel blue background
  },
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1D3557', // dark blue text
    marginBottom: 6,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#457B9D',
    marginBottom: 14,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#A6C8FF',
    marginBottom: 16,
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#A6C8FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  habitText: {
    fontSize: 18,
    color: '#1D3557',
    flex: 1,
    marginRight: 10,
    textAlign: 'center',
  },
  habitTextDone: {
    textDecorationLine: 'line-through',
    color: '#6C7B8B',
    textAlign: 'center',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    backgroundColor: '#A6C8FF', // pastel blue
  },
  undoneButton: {
    backgroundColor: '#74A3FF', // deeper blue
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});