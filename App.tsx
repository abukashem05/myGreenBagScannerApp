import React, { useState, useEffect, useRef } from 'react';
import {
  AppRegistry,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import database from '@react-native-firebase/database';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome for icons

const { width, height } = Dimensions.get('window');

const App = () => {
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null); // null: not scanned, true: valid, false: invalid
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Optional: Reset state when component mounts or relevant data changes
    setScanned(false);
    setData('');
    setIsValid(null);
    setErrorMessage('');
  }, []);

  // Function to handle barcode scan
  const handleBarCodeScanned = async ({ data: scannedData }: { data: string }) => { // Changed 'data' to 'scannedData' to avoid conflict
    if (scanned) return; // Prevent multiple scans
    setScanned(true);
    setData(scannedData); // Use scannedData here
    setIsLoading(true);
    setErrorMessage(''); // Clear previous errors

    try {
      // Reference to your Firebase Realtime Database's valid_qr_codes node
      const dbRef = database().ref('/valid_qr_codes');

      // Check if the scanned data exists in Firebase
      const snapshot = await dbRef.once('value');
      const validQrCodes = snapshot.val(); // Get all valid QR codes as an object

      // Ensure validQrCodes is an array for includes() to work correctly
      const validQrCodesArray = Array.isArray(validQrCodes) ? validQrCodes : (validQrCodes ? Object.values(validQrCodes) : []);


      if (validQrCodesArray.includes(scannedData)) { // Use scannedData and validQrCodesArray here
        setIsValid(true); // QR code is valid
        Alert.alert('সফল!', `QR কোডটি বৈধ: ${scannedData}`, [{ text: 'ঠিক আছে', onPress: resetScanner }]);
      } else {
        setIsValid(false); // QR code is invalid
        setErrorMessage('QR কোডটি অবৈধ বা পাওয়া যায়নি।');
        Alert.alert('ত্রুটি!', `QR কোডটি অবৈধ বা পাওয়া যায়নি: ${scannedData}`, [{ text: 'ঠিক আছে', onPress: resetScanner }]);
      }
    } catch (error) {
      console.error("Firebase ডেটাবেস থেকে ডেটা ফেচ করার সময় ত্রুটি:", error);
      const errorMsg = (error instanceof Error && error.message) ? error.message : String(error);
      setErrorMessage(`ডেটাবেস ত্রুটি: ${errorMsg}`);
      Alert.alert('ত্রুটি!', 'ডেটাবেস থেকে ডেটা ফেচ করার সময় ত্রুটি হয়েছে।', [{ text: 'ঠিক আছে', onPress: resetScanner }]);
      setIsValid(false);
    } finally {
      setIsLoading(false);
      setShowModal(true); // Show the modal after processing
    }
  };

  // Function to reset the scanner state
  const resetScanner = () => {
    setScanned(false);
    setData('');
    setIsValid(null);
    setErrorMessage('');
    setShowModal(false);
  };

  // Function to open scanned data in browser if it's a URL
  const openLink = async () => {
    if (data && await Linking.canOpenURL(data)) {
      Linking.openURL(data);
    } else {
      Alert.alert('ত্রুটি', 'এটি কোনো বৈধ লিঙ্ক নয় বা খোলা যাচ্ছে না।');
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        onBarCodeRead={scanned ? undefined : handleBarCodeScanned} // Only read if not already scanned
        androidCameraPermissionOptions={{
          title: 'ক্যামেরার অনুমতি দিন',
          message: 'QR কোড স্ক্যান করার জন্য আপনার ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন।',
          buttonPositive: 'ঠিক আছে',
          buttonNegative: 'বাতিল',
        }}
        captureAudio={false} // Disable audio capture
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <Text style={styles.scanText}>QR কোড স্ক্যান করুন</Text>
          </View>
          <View style={styles.middleOverlay}>
            <View style={styles.leftRightOverlay} />
            <View style={styles.scanBox}>
              {/* Optional: Add scan line animation */}
            </View>
            <View style={styles.leftRightOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            {isLoading && <ActivityIndicator size="large" color="#ffffff" />}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
            {data && !isLoading && (
              <Text style={styles.scanResultText}>স্ক্যান করা কোড: {data}</Text>
            )}
            <TouchableOpacity onPress={resetScanner} style={styles.scanButton}>
              <Text style={styles.scanButtonText}>পুনরায় স্ক্যান করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNCamera>

      {/* Modal for displaying scan results clearly */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={resetScanner}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>স্ক্যান ফলাফল</Text>
            <View style={styles.resultDisplay}>
              {isValid === true && (
                <>
                  <Icon name="check-circle" size={50} color="#4CAF50" />
                  <Text style={styles.statusTextValid}>বৈধ QR কোড</Text>
                </>
              )}
              {isValid === false && (
                <>
                  <Icon name="times-circle" size={50} color="#F44336" />
                  <Text style={styles.statusTextInvalid}>অবৈধ QR কোড</Text>
                </>
              )}
              {isLoading && (
                <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
              )}
              {data ? (
                <Text style={styles.scannedDataText}>স্ক্যান করা কোড: {data}</Text>
              ) : null}
              {errorMessage ? (
                <Text style={styles.modalErrorText}>{errorMessage}</Text>
              ) : null}
            </View>

            <View style={styles.modalButtons}>
              {isValid === true && data && (
                <TouchableOpacity onPress={openLink} style={[styles.modalButton, styles.openLinkButton]}>
                  <Text style={styles.modalButtonText}>লিঙ্ক খুলুন</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={resetScanner} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>বন্ধ করুন ও পুনরায় স্ক্যান করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topOverlay: {
    flex: 0.1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  middleOverlay: {
    flex: 0.6,
    flexDirection: 'row',
  },
  leftRightOverlay: {
    flex: 0.2,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanBox: {
    flex: 0.6,
    borderColor: '#00FF00',
    borderWidth: 2,
  },
  bottomOverlay: {
    flex: 0.3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanResultText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  scanButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  resultDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTextValid: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  statusTextInvalid: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 10,
  },
  scannedDataText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    color: '#555',
  },
  modalErrorText: {
    color: '#FF0000',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 2,
    marginHorizontal: 5,
  },
  openLinkButton: {
    backgroundColor: '#FF9800', // Different color for open link button
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

AppRegistry.registerComponent('myGreenBagScannerApp', () => App);

export default App;