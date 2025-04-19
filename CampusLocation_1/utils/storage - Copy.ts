import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'REMINDERS';

export const getAllReminders = async () => {
  const data = await AsyncStorage.getItem(REMINDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveReminder = async (reminder: any) => {
  const reminders = await getAllReminders();
  reminders.push(reminder);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

export const deleteReminder = async (id: string) => {
  const reminders = await getAllReminders();
  const updated = reminders.filter((r: any) => r.id !== id);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
};

export const markReminderComplete = async (id: string) => {
    await deleteReminder(id);
  };