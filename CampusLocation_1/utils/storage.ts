import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'REMINDERS';

export const getAllReminders = async () => {
  const data = await AsyncStorage.getItem(REMINDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveReminder = async (reminder: any) => {
  const reminders = await getAllReminders();
  
  // Check if the reminder already exists (for updates)
  const existingIndex = reminders.findIndex((r: any) => r.id === reminder.id);
  
  if (existingIndex >= 0) {
    // Update existing reminder
    reminders[existingIndex] = reminder;
  } else {
    // Add new reminder
    reminders.push(reminder);
  }
  
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  return reminder;
};

export const deleteReminder = async (id: string) => {
  const reminders = await getAllReminders();
  const updated = reminders.filter((r: any) => r.id !== id);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
};

export const markReminderComplete = async (id: string) => {
  // Get all reminders
  const reminders = await getAllReminders();
  
  // Find the reminder to update
  const reminderIndex = reminders.findIndex((r: any) => r.id === id);
  
  if (reminderIndex >= 0) {
    // Update the completed status
    reminders[reminderIndex] = {
      ...reminders[reminderIndex],
      completed: true
    };
    
    // Save the updated reminders list
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    return reminders[reminderIndex];
  }
  
  return null;
};

export const markReminderIncomplete = async (id: string) => {
  // Get all reminders
  const reminders = await getAllReminders();
  
  // Find the reminder to update
  const reminderIndex = reminders.findIndex((r: any) => r.id === id);
  
  if (reminderIndex >= 0) {
    // Update the completed status
    reminders[reminderIndex] = {
      ...reminders[reminderIndex],
      completed: false
    };
    
    // Save the updated reminders list
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    return reminders[reminderIndex];
  }
  
  return null;
};
