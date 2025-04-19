import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { getAllLocationPins, saveLocationPin, deleteLocationPin, LocationPin } from '../utils/locations';

export default function PinsScreen() {
  const [pins, setPins] = useState<LocationPin[]>([]);
  const [addingPin, setAddingPin] = useState(false);
  const [newPinName, setNewPinName] = useState('');
  const [currentCoords, setCurrentCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempPin, setTempPin] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadPins();
    getCurrentCoords();
  }, []);

  const loadPins = async () => {
    const pins = await getAllLocationPins();
    setPins(pins);
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
    setPins([...pins, pin]);
    setAddingPin(false);
    setNewPinName('');
    Alert.alert('Location saved!');
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
    setPins([...pins, pin]);
    setShowMapModal(false);
    setAddingPin(false);
    setNewPinName('');
    setTempPin(null);
    Alert.alert('Location saved!');
  };

  const handleDeletePin = async (name: string) => {
    await deleteLocationPin(name);
    setPins(pins.filter(pin => pin.name !== name));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Pins</Text>
      <FlatList
        data={pins}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <View style={styles.pinItem}>
            <Text style={styles.pinName}>{item.name}</Text>
            <Text style={styles.pinCoords}>
              Lat: {item.latitude.toFixed(5)}, Lon: {item.longitude.toFixed(5)}
            </Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePin(item.name)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pins saved yet.</Text>}
      />

      {/* Add pin by naming current location */}
      {addingPin && !showMapModal && (
        <View style={styles.addPinBox}>
          <Text style={styles.label}>Name for this location</Text>
          <TextInput
            placeholder="Name for this location"
            value={newPinName}
            onChangeText={setNewPinName}
            style={styles.input}
            placeholderTextColor="#aaa"
          />
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity style={styles.addPinBtn} onPress={handleAddCurrentLocation}>
              <Text style={styles.addPinBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addPinBtn, { backgroundColor: '#aaa', marginLeft: 8 }]} onPress={() => { setAddingPin(false); setNewPinName(''); }}>
              <Text style={styles.addPinBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
            <Text style={styles.label}>Name for this pin</Text>
            <TextInput
              placeholder="Name for this pin"
              value={newPinName}
              onChangeText={setNewPinName}
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity style={styles.addPinBtn} onPress={handleSavePinFromMap}>
                <Text style={styles.addPinBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addPinBtn, { backgroundColor: '#aaa', marginLeft: 8 }]} onPress={() => { setShowMapModal(false); setTempPin(null); setNewPinName(''); }}>
                <Text style={styles.addPinBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'space-evenly' }}>
        <TouchableOpacity style={styles.addPinBtn} onPress={() => setAddingPin(true)}>
          <Text style={styles.addPinBtnText}>Add Current Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addPinBtn} onPress={() => setShowMapModal(true)}>
          <Text style={styles.addPinBtnText}>Add Pin on Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  pinItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 8, borderRadius: 6 },
  pinName: { fontWeight: 'bold', fontSize: 16 },
  pinCoords: { color: '#555', fontSize: 12 },
  deleteBtn: { marginTop: 8, padding: 6, backgroundColor: '#ef4444', borderRadius: 6, alignSelf: 'flex-start' },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#aaa', marginVertical: 20 },
  addPinBox: {
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginTop: 12,
  },
  addPinBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    flex: 1,
  },
  addPinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
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
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
    color: '#222',
  },
});
