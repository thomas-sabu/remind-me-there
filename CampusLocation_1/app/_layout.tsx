import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Reminders" }} />
      <Stack.Screen name="add-reminder" options={{ title: "Add Reminder" }} />
    </Stack>
  );
}
