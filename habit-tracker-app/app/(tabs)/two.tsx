import { StyleSheet, TextInput, FlatList, TouchableOpacity, Text, SafeAreaView, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function CreateScreen() {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [todos, setTodos] = useState<any>([]);
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
        completionLog: [] // ✅ Initialize empty log
      });

      setName('');
      setFrequency('');
      setSelectedDays([]);
      fetchHabits();
    } else {
      console.log("Incomplete form or no user");
    }
  };

  const toggleDay = (day: string) => {
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
              <Text>{item.name} ({item.frequency})</Text>
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
  },
  container: {
    flex: 1,
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    color: '#444',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  chipGroup: {
    flexDirection: 'row',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#aaa',
    marginRight: 10,
  },
  chipSelected: {
    backgroundColor: '#FFA726',
    borderColor: '#FFA726',
  },
  chipText: {
    color: '#333',
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
    borderColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  dayChipSelected: {
    backgroundColor: '#5C6BC0',
    borderColor: '#5C6BC0',
  },
  dayChipText: {
    color: '#333',
  },
  dayChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#FFA726',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  todoContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});