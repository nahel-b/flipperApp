import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SERVICE_UUID = '8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000';
export const DEFAULT_CHARACTERISTIC_UUID = '19ed82ae-ed21-4c9d-4145-228e61fe0000';

export const UUIDContext = createContext();

export function UUIDProvider({ children }) {
  const [serviceUuid, setServiceUuid] = useState(DEFAULT_SERVICE_UUID);
  const [characteristicUuid, setCharacteristicUuid] = useState(DEFAULT_CHARACTERISTIC_UUID);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedService = await AsyncStorage.getItem('serviceUuid');
        const storedChar = await AsyncStorage.getItem('characteristicUuid');
        if (storedService) setServiceUuid(storedService);
        if (storedChar) setCharacteristicUuid(storedChar);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem('serviceUuid', serviceUuid);
      AsyncStorage.setItem('characteristicUuid', characteristicUuid);
    }
  }, [serviceUuid, characteristicUuid, loading]);

  const resetUuids = async () => {
    setServiceUuid(DEFAULT_SERVICE_UUID);
    setCharacteristicUuid(DEFAULT_CHARACTERISTIC_UUID);
    await AsyncStorage.setItem('serviceUuid', DEFAULT_SERVICE_UUID);
    await AsyncStorage.setItem('characteristicUuid', DEFAULT_CHARACTERISTIC_UUID);
  };

  return (
    <UUIDContext.Provider value={{ serviceUuid, setServiceUuid, characteristicUuid, setCharacteristicUuid, resetUuids, loading }}>
      {children}
    </UUIDContext.Provider>
  );
}
