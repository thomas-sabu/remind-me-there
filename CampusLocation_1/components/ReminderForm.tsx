import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Dropdown } from 'react-native-element-dropdown';
import { saveReminder } from '../utils/storage';
import { getAllLocationPins, saveLocationPin, LocationPin } from '../utils/locations';
import { useRouter } from 'expo-router';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ReminderForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationPins, setLocationPins] = useState<LocationPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<LocationPin | null>(null);
  const [addingNewPin, setAddingNewPin] = useState(false);
  const [newPinName, setNewPinName] = useState('');
  const [currentCoords, setCurrentCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempPin, setTempPin] = useState<{ latitude: number; longitude: number } | null>(null);

  // Time window states
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadPins();
    getCurrentCoords();
    Notifications.requestPermissionsAsync();
  }, []);

  const loadPins = async () => {
    const pins = await getAllLocationPins();
    setLocationPins(pins);
  };

  const getCurrentCoords = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let loc = await Location.getCurrentPositionAsync({});
    setCurrentCoords(loc.coords);
  };

  const handleAddCurrentLocation = async () => {
    if (!currentCoords || !newPinName) {
      Alert.alert('Please enter a name for this location.');
      return;
    }
    const pin: LocationPin = {
      name: newPinName,
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
    };
    await saveLocationPin(pin);
    setLocationPins([...locationPins, pin]);
    setSelectedPin(pin);
    setAddingNewPin(false);
    setNewPinName('');
    Alert.alert('Location saved!', 'You can now select it from the dropdown.');
  };

  const handleMapPress = (e: MapPressEvent) => {
    setTempPin(e.nativeEvent.coordinate);
  };

  const handleSavePinFromMap = async () => {
    if (!tempPin || !newPinName) {
      Alert.alert('Please select a location and enter a name.');
      return;
    }
    const pin: LocationPin = {
      name: newPinName,
      latitude: tempPin.latitude,
      longitude: tempPin.longitude,
    };
    await saveLocationPin(pin);
    setLocationPins([...locationPins, pin]);
    setSelectedPin(pin);
    setShowMapModal(false);
    setAddingNewPin(false);
    setNewPinName('');
    setTempPin(null);
    Alert.alert('Location saved!', 'You can now select it from the dropdown.');
  };

  const handleSubmit = async () => {
    if (!title || !selectedPin) {
      Alert.alert('Title and location required');
      return;
    }
    if (endTime <= startTime) {
      Alert.alert('End time must be after start time');
      return;
    }
    const reminder = {
      id: Date.now().toString(),
      title,
      description,
      latitude: selectedPin.latitude,
      longitude: selectedPin.longitude,
      locationName: selectedPin.name,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      completed: false,
    };
    await saveReminder(reminder);

    // Immediate notification if at location and within window
    const now = new Date();
    if (
      currentCoords &&
      Math.abs(currentCoords.latitude - selectedPin.latitude) < 0.0009 && // ~100m
      Math.abs(currentCoords.longitude - selectedPin.longitude) < 0.0009 &&
      now >= startTime &&
      now <= endTime
    ) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: `You have a reminder: ${title}`,
        },
        trigger: null,
      });
    }

    Keyboard.dismiss();
    router.replace('/');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Title</Text>
          <TextInput
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholderTextColor="#aaa"
            returnKeyType="done"
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 80 }]}
            multiline
            placeholderTextColor="#aaa"
            returnKeyType="done"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
            <Text style={styles.saveBtnText}>Save Reminder</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Time Window</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.timeBtnText}>Start: {startTime.toLocaleString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.timeBtnText}>End: {endTime.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="datetime"
              display="default"
              onChange={(_, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartTime(selectedDate);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="datetime"
              display="default"
              onChange={(_, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndTime(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Location</Text>
          <Dropdown
            style={styles.dropdown}
            data={[
              ...locationPins.map(pin => ({
                label: pin.name,
                value: pin.name,
                pin,
              })),
              { label: '+ Add current location', value: '__add__' },
              { label: '+ Add pin on map', value: '__map__' },
            ]}
            labelField="label"
            valueField="value"
            placeholder="Select location"
            value={selectedPin?.name}
            onChange={item => {
              if (item.value === '__add__') {
                setAddingNewPin(true);
              } else if (item.value === '__map__') {
                setShowMapModal(true);
                setAddingNewPin(true);
              } else {
                setSelectedPin(item.pin);
              }
            }}
          />

          {/* Add pin by naming current location */}
          {addingNewPin && !showMapModal && (
            <View style={styles.addPinBox}>
              <TextInput
                placeholder="Name for this location"
                value={newPinName}
                onChangeText={setNewPinName}
                style={styles.input}
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity style={styles.addPinBtn} onPress={handleAddCurrentLocation}>
                <Text style={styles.addPinBtnText}>Save Current Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Add pin by selecting on map */}
          <Modal visible={showMapModal} animationType="slide">
            <View style={{ flex: 1 }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: currentCoords?.latitude || 12.9716,
                  longitude: currentCoords?.longitude || 77.5946,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
              >
                {tempPin && (
                  <Marker coordinate={tempPin} />
                )}
              </MapView>
              <View style={{ padding: 16, backgroundColor: '#f8fafc' }}>
                <TextInput
                  placeholder="Name for this pin"
                  value={newPinName}
                  onChangeText={setNewPinName}
                  style={styles.input}
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.addPinBtn} onPress={handleSavePinFromMap}>
                  <Text style={styles.addPinBtnText}>Save Pin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addPinBtn, { backgroundColor: '#aaa', marginTop: 8 }]} onPress={() => { setShowMapModal(false); setTempPin(null); setNewPinName(''); }}>
                  <Text style={styles.addPinBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'flex-start',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#222',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  addPinBox: {
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addPinBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  addPinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  timeBtn: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  timeBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
