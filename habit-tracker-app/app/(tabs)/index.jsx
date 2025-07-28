import {
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  SafeAreaView,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function CreateScreen() {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [todos, setTodos] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const habitCollection = collection(db, 'habits');
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    if (user) {
      const q = query(habitCollection, where('userId', '==', user.uid));
      const data = await getDocs(q);
      setTodos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } else {
      console.log('No user logged in');
    }
  };

  const addTodo = async () => {
    if (user && name && frequency) {
      const today = new Date();
      const createdAtDateString = today.toISOString().split('T')[0];

      await addDoc(habitCollection, {
        name,
        frequency,
        days: frequency === 'weekly' ? selectedDays : [],
        userId: user.uid,
        completionLog: [],
        createdAt: createdAtDateString,
        stoppedAt: null,
      });

      setName('');
      setFrequency('');
      setSelectedDays([]);
      fetchHabits();
    } else {
      console.log('Incomplete form or no user');
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Create Habit</Text>

        <TextInput
          placeholder="Habit name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#000"
        />

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.chipGroup}>
          <TouchableOpacity
            onPress={() => {
              setFrequency('daily');
              setSelectedDays([]);
            }}
            style={[styles.chip, frequency === 'daily' && styles.chipSelected]}
          >
            <Text style={frequency === 'daily' ? styles.chipTextSelected : styles.chipText}>
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFrequency('weekly')}
            style={[styles.chip, frequency === 'weekly' && styles.chipSelected]}
          >
            <Text style={frequency === 'weekly' ? styles.chipTextSelected : styles.chipText}>
              Weekly
            </Text>
          </TouchableOpacity>
        </View>

        {frequency === 'weekly' && (
          <>
            <Text style={styles.label}>Select Days</Text>
            <View style={styles.dayGroup}>
              {weekdays.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayChip,
                    selectedDays.includes(day) && styles.dayChipSelected,
                  ]}
                >
                  <Text
                    style={
                      selectedDays.includes(day)
                        ? styles.dayChipTextSelected
                        : styles.dayChipText
                    }
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity onPress={addTodo} style={styles.addButton}>
          <Text style={styles.buttonText}>Add Habit</Text>
        </TouchableOpacity>

        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.todoCard}>
              <Text style={styles.todoText}>
                {item.name} ({item.frequency})
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
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
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '#A6C8FF',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#F0F7FF',
    color: '#000',
  },
  label: {
    width: '100%',
    marginBottom: 8,
    fontWeight: '600',
    color: '#000',
    fontSize: 16,
  },
  chipGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#A6C8FF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#A6C8FF',
  },
  chipSelected: {
    backgroundColor: '#74A3FF',
  },
  chipText: {
    color: '#000',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  dayGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#A6C8FF',
    borderWidth: 1,
    borderColor: '#A6C8FF',
    margin: 4,
  },
  dayChipSelected: {
    backgroundColor: '#74A3FF',
  },
  dayChipText: {
    color: '#000',
    fontWeight: '600',
  },
  dayChipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#74A3FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#74A3FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  todoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#A6C8FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  todoText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});