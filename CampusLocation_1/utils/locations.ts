import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocationPin = {
  name: string;
  latitude: number;
  longitude: number;
};

const LOCATIONS_KEY = 'LOCATIONS';

export const getAllLocationPins = async (): Promise<LocationPin[]> => {
  const data = await AsyncStorage.getItem(LOCATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLocationPin = async (pin: LocationPin) => {
  const pins = await getAllLocationPins();
  pins.push(pin);
  await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(pins));
};

export const deleteLocationPin = async (name: string) => {
  const pins = await getAllLocationPins();
  const updated = pins.filter((p: LocationPin) => p.name !== name);
  await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(updated));
};
