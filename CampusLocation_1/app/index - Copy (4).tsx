import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import ReminderList from '../components/ReminderList';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllReminders, deleteReminder, markReminderComplete, markReminderIncomplete } from '../utils/storage';
import { getAllLocationPins } from '../utils/locations';

// Place this outside the component so it persists
const lastNotified: { [reminderId: string]: number } = {};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomeScreen() {
  const [reminders, setReminders] = useState([]);
  const [location, setLocation] = useState(null);
  const [pins, setPins] = useState([]);
  const router = useRouter();
  const locationSubscription = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
      loadPins();
    }, [])
  );

  useEffect(() => {
    startLocationTracking();
    
    // Clean up the subscription when component unmounts
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    const FIVE_MINUTES = 5 * 60 * 1000;
    const TEN_SECONDS = 10 * 1000;
    const interval = setInterval(async () => {
      if (!location) return;
      const allReminders = await getAllReminders();
      const now = Date.now();
      
      for (const reminder of allReminders || []) {
        if (!reminder || reminder.completed) {
          delete lastNotified[reminder?.id];
          continue;
        }

        const start = new Date(reminder.startTime);
        const end = new Date(reminder.endTime);
        const dist = getDistance(
          location.latitude,
          location.longitude,
          reminder.latitude,
          reminder.longitude
        );

        if (
          now >= start.getTime() &&
          now <= end.getTime() &&
          // dist < 100
          dist < 50
        ) {
          if (
            !lastNotified[reminder.id] ||
            // now - lastNotified[reminder.id] >= FIVE_MINUTES
            now - lastNotified[reminder.id] >= TEN_SECONDS
          ) {
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Reminder: ${reminder.title}`,
                  body: reminder.description || 'You have a location-based reminder!',
                },
                trigger: null,
              });
              lastNotified[reminder.id] = now;
            } catch (e) {
              console.log('Notification error:', e);
            }
          }
        } else {
          delete lastNotified[reminder.id];
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [location]);

  const loadReminders = async () => {
    const data = await getAllReminders();
    // Sort with incomplete first, then completed
    const validReminders = Array.isArray(data) ? data.filter(Boolean) : [];
    const sortedReminders = [
      ...validReminders.filter(r => !r.completed),
      ...validReminders.filter(r => r.completed)
    ];
    setReminders(sortedReminders);
  };

  const loadPins = async () => {
    const pins = await getAllLocationPins();
    setPins(Array.isArray(pins) ? pins : []);
  };

  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    // First get the current position immediately
    let initialPosition = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    setLocation(initialPosition.coords);
    
    // Then start watching for position updates
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,    // Update every 5 seconds
        distanceInterval: 5,   // Update every 5 meters
      },
      (newLocation) => {
        console.log('Location updated:', newLocation.coords);
        setLocation(newLocation.coords);
      }
    );
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    setReminders(reminders.filter((r: any) => r && r.id !== id));
  };

  const handleComplete = async (id: string) => {
    await markReminderComplete(id);
    // Reload from storage to ensure persistence
    loadReminders();
  };

  const handleIncomplete = async (id: string) => {
    await markReminderIncomplete(id);
    // Reload from storage to ensure persistence
    loadReminders();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>RemindMeThere</Text>

      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Marker for user location */}
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            pinColor="blue"
            title="You are here"
          />

          {/* Markers for all reminders */}
          {reminders.filter(Boolean).map(reminder => (
            <Marker
              key={reminder.id}
              coordinate={{
                latitude: reminder.latitude,
                longitude: reminder.longitude,
              }}
              pinColor={reminder.completed ? "gray" : "red"}
              title={reminder.title}
              description={reminder.description}
            />
          ))}

          {/* Markers for all saved pins */}
          {pins.filter(Boolean).map(pin => (
            <Marker
              key={pin.name}
              coordinate={{
                latitude: pin.latitude,
                longitude: pin.longitude,
              }}
              pinColor="green"
              title={pin.name}
            />
          ))}
        </MapView>
      )}

      <ReminderList
        reminders={reminders}
        onDelete={handleDelete}
        onComplete={handleComplete}
        onIncomplete={handleIncomplete}
      />

      <Button title="Add Reminder" onPress={() => router.push('/add-reminder')} />
      <Button title="Manage Pins" onPress={() => router.push('/pins')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  map: { width: '100%', height: 200, marginVertical: 8, borderRadius: 8 },
});
