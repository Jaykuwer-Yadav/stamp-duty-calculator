import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

export const handleBiometricAuth = async (): Promise<boolean> => {
  try {
    // Web simulation fallback for easy testing
    if (Platform.OS === 'web') {
      console.log('Biometrics on Web: Simulating success...');
      return true;
    }

    // 1. Check if the device has hardware support (Fingerprint/FaceID)
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      Alert.alert('Error', 'Your device does not support biometric login.');
      return false;
    }

    // 2. Check if the user has actually set up a fingerprint/face on their phone
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert('Setup Required', 'Please set up a fingerprint/FaceID in your phone settings first.');
      return false;
    }

    // 3. Trigger the scanner!
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Admyproperty Ledger',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      console.log('User verified!');
      return true; // Proceed to log them in!
    } else {
      console.log('Verification failed.');
      return false;
    }
  } catch (error) {
    console.error('Biometric Error:', error);
    return false;
  }
};
