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
  const todayString = todayDate.toISOString().split('T')[0]; // e.g., "2025-07-22"
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[todayDate.getDay()];
  const formattedDate = todayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }); // e.g., "Tuesday, July 23"

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
        where('days', 'array-contains', currentDayName.slice(0, 3)) // "Tue"
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
              <TouchableOpacity
                onPress={() => toggleCompletion(item)}
                style={styles.habitRow}
              >
                <Text style={styles.habitText}>
                  {done ? '✅' : '⬜️'} {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 10,
  },
  habitRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  habitText: {
    fontSize: 18,
    color: '#222',
  },
});