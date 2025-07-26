import { StyleSheet, TextInput, FlatList, TouchableOpacity, Text, SafeAreaView, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
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
      const q = query(habitCollection, where("userId", "==", user.uid));
      const data = await getDocs(q);
      setTodos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } else {
      console.log("No user logged in");
    }
  };

  const addTodo = async () => {
    if (user && name && frequency) {
      await addDoc(habitCollection, {
        name,
        frequency,
        days: frequency === 'weekly' ? selectedDays : [],
        userId: user.uid,
        completionLog: [],
        createdAt: serverTimestamp(),  // sets to current server time
        stoppedAt: [], 
      });

      setName('');
      setFrequency('');
      setSelectedDays([]);
      fetchHabits();
    } else {
      console.log("Incomplete form or no user");
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Add Habit</Text>

        {/* Habit Name */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Habit name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Frequency Chips */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipGroup}>
            <TouchableOpacity
              onPress={() => {
                setFrequency('daily');
                setSelectedDays([]);
              }}
              style={[styles.chip, frequency === 'daily' && styles.chipSelected]}
            >
              <Text style={frequency === 'daily' ? styles.chipTextSelected : styles.chipText}>Daily</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFrequency('weekly')}
              style={[styles.chip, frequency === 'weekly' && styles.chipSelected]}
            >
              <Text style={frequency === 'weekly' ? styles.chipTextSelected : styles.chipText}>Weekly</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Day Picker (if weekly) */}
        {frequency === 'weekly' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Days</Text>
            <View style={styles.dayGroup}>
              {weekdays.map(day => (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayChip,
                    selectedDays.includes(day) && styles.dayChipSelected
                  ]}
                >
                  <Text style={selectedDays.includes(day) ? styles.dayChipTextSelected : styles.dayChipText}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity onPress={addTodo} style={styles.addButton}>
          <Text style={styles.buttonText}>Add Habit</Text>
        </TouchableOpacity>

        {/* Habit List */}
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.todoContainer}>
              <Text style={styles.todoText}>{item.name} ({item.frequency})</Text>
            </View>
          )}
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
    alignItems: 'center', // center content horizontally
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#5C6BC0', // pastel purple text
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    color: '#4C51BF', // purple
  },
  input: {
    height: 40,
    borderColor: '#A6C8FF', // pastel blue border
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F0F7FF',
    color: '#1D3557',
  },
  chipGroup: {
    flexDirection: 'row',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5C6BC0', // pastel purple border
    marginRight: 10,
    backgroundColor: '#E0E7FF',
  },
  chipSelected: {
    backgroundColor: '#5C6BC0',
    borderColor: '#5C6BC0',
  },
  chipText: {
    color: '#5C6BC0',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5C6BC0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: '#E0E7FF',
  },
  dayChipSelected: {
    backgroundColor: '#5C6BC0',
    borderColor: '#5C6BC0',
  },
  dayChipText: {
    color: '#5C6BC0',
    fontWeight: '600',
  },
  dayChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#5C6BC0', // pastel purple
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  todoContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#A6C8FF',
    width: '100%',
  },
  todoText: {
    fontSize: 18,
    color: '#1D3557',
  },
});