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
  const [habits, setHabits] = useState<any[]>([]);
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
      setUsername(user.displayName || user.email?.split('@')[0] || 'User');
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

  const toggleCompletion = async (habit: any) => {
    const ref = doc(db, 'habits', habit.id);
    const log = habit.completionLog || [];
    const alreadyDone = log.includes(todayString);

    const newLog = alreadyDone
      ? log.filter((d: string) => d !== todayString)
      : [...log, todayString];

    await updateDoc(ref, { completionLog: newLog });
    fetchTodayHabits();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.greeting}>Welcome, {username}</Text>
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
          contentContainerStyle={{ paddingBottom: 40 }}
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
    padding: 20,
    alignItems: 'center', // center horizontally
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
    width: '90%',
    borderBottomWidth: 1,
    borderBottomColor: '#A6C8FF',
    marginBottom: 20,
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'center', // center row contents horizontally
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 8,
    minWidth: '85%', // minimum width for card
    shadowColor: '#A6C8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  habitText: {
    fontSize: 18,
    color: '#1D3557',
    flexShrink: 1, // allow wrapping if too long
    minWidth: '60%', // minimum width so text and button have space
  },
  habitTextDone: {
    textDecorationLine: 'line-through',
    color: '#6C7B8B',
  },
  toggleButton: {
    minWidth: 90, // minimum width so button is comfortable size
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 24, // space between text and button
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    backgroundColor: '#A6C8FF', // pastel blue button
  },
  undoneButton: {
    backgroundColor: '#74A3FF', // deeper blue button
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});