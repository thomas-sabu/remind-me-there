import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

type Reminder = {
  id: string;
  title: string;
  description?: string;
  locationName?: string;
  startTime?: string;
  endTime?: string;
  completed?: boolean;
};

type Props = {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onIncomplete: (id: string) => void; // Added new prop
};

export default function ReminderList({ reminders, onDelete, onComplete, onIncomplete }: Props) {
  if (!reminders.length) {
    return <Text style={styles.empty}>No reminders yet.</Text>;
  }

  return (
    <FlatList
      data={reminders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={[styles.item, item.completed && styles.completed]}>
          <Text style={[styles.title, item.completed && styles.crossed]}>{item.title}</Text>
          {item.description ? (
            <Text style={item.completed && styles.crossed}>{item.description}</Text>
          ) : null}
          {item.locationName ? (
            <Text style={[styles.location, item.completed && styles.crossed]}>
              {item.locationName}
            </Text>
          ) : null}
          {item.startTime && item.endTime ? (
            <Text style={[styles.date, item.completed && styles.crossed]}>
              {new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleString()}
            </Text>
          ) : null}
          <View style={styles.actions}>
            {item.completed ? (
              // New button for completed reminders
              <TouchableOpacity
                style={[styles.completeBtn, { backgroundColor: '#6366f1' }]}
                onPress={() => onIncomplete(item.id)}>
                <Text style={styles.completeBtnText}>Mark Incomplete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => onComplete(item.id)}>
                <Text style={styles.completeBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(item.id)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { padding: 10, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 8, borderRadius: 6 },
  completed: { backgroundColor: '#e0ffe0' },
  title: { fontWeight: 'bold', fontSize: 16 },
  location: { fontStyle: 'italic', color: '#555' },
  date: { color: '#888', fontSize: 12 },
  empty: { textAlign: 'center', color: '#aaa', marginVertical: 20 },
  actions: { flexDirection: 'row', marginTop: 8 },
  completeBtn: { marginRight: 8, padding: 6, backgroundColor: '#10b981', borderRadius: 6 },
  completeBtnText: { color: '#fff', fontWeight: 'bold' },
  deleteBtn: { padding: 6, backgroundColor: '#ef4444', borderRadius: 6 },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
  crossed: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
});
