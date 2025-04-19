export type Reminder = {
  _id: string;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
};

const API_URL = 'http://localhost:3000'; // Change if your backend runs elsewhere

export const getReminders = async (): Promise<Reminder[]> => {
  const res = await fetch(`${API_URL}/reminders`);
  return res.json();
};

export const addReminder = async (reminder: Omit<Reminder, '_id'>) => {
  await fetch(`${API_URL}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
};
