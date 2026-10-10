import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

type Category =
  | 'pothole'
  | 'broken_light'
  | 'water_leak'
  | 'blocked_drainage'
  | 'garbage_dumping'
  | 'damaged_road'
  | 'fallen_tree'
  | 'broken_signage'
  | 'flooding'
  | 'other';

type Duration = 'just_noticed' | 'few_days' | 'few_weeks' | 'months' | 'over_a_year' | 'not_sure';

type Step = 'camera' | 'details' | 'success';

const CATEGORIES: { label: string; value: Category; icon: string }[] = [
  { label: 'Pothole', value: 'pothole', icon: '🕳️' },
  { label: 'Broken light', value: 'broken_light', icon: '💡' },
  { label: 'Water leak', value: 'water_leak', icon: '💧' },
  { label: 'Blocked drainage', value: 'blocked_drainage', icon: '🚰' },
  { label: 'Garbage dumping', value: 'garbage_dumping', icon: '🗑️' },
  { label: 'Damaged road', value: 'damaged_road', icon: '🛣️' },
  { label: 'Fallen tree', value: 'fallen_tree', icon: '🌳' },
  { label: 'Broken sign/light', value: 'broken_signage', icon: '🚦' },
  { label: 'Flooding', value: 'flooding', icon: '🌊' },
  { label: 'Other', value: 'other', icon: '❓' },
];

const DURATIONS: { label: string; value: Duration }[] = [
  { label: 'Just noticed', value: 'just_noticed' },
  { label: 'A few days', value: 'few_days' },
  { label: 'A few weeks', value: 'few_weeks' },
  { label: 'Months', value: 'months' },
  { label: 'Over a year', value: 'over_a_year' },
  { label: 'Not sure', value: 'not_sure' },
];

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<Step>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.text}>
          InfraWatch needs your camera to photograph problems you want to report.
        </Text>
        {permission.canAskAgain ? (
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
            accessibilityLabel="Grant camera permission"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Grant permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openSettings()}
            accessibilityLabel="Open app settings to enable camera"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Open settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync();
    if (!photo) return;
    setPhotoUri(photo.uri);
    setStep('details');
    setLocating(true);

    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocating(false);
      Alert.alert(
        'Location needed',
        'InfraWatch needs your location to place this report on the map.',
        canAskAgain
          ? undefined
          : [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open settings', onPress: () => Linking.openSettings() },
            ]
      );
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({});
      setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
    } finally {
      setLocating(false);
    }
  }

  function retake() {
    setPhotoUri(null);
    setLocation(null);
    setCategory(null);
    setDuration(null);
    setDescription('');
    setStep('camera');
  }

  async function submitReport() {
    if (!photoUri || !location || !category) {
      Alert.alert('Missing info', 'Please select a category before submitting.');
      return;
    }
    if (!duration) {
      Alert.alert('Missing info', 'Please let us know roughly how long this problem has been there.');
      return;
    }
    if (description.trim().length === 0) {
      Alert.alert('Description needed', 'Please add a short description so officials understand the problem.');
      return;
    }

    setSubmitting(true);

    // Placeholder: this object matches the reports_private schema.
    // Swap this block for a real write once Firestore is wired up.
    const report = {
      category,
      description: description.trim(),
      durationEstimate: duration,
      photoUrl: photoUri,
      location,
      ward: '',
      reporterId: null,
      reportedAt: new Date().toISOString(),
      status: 'received',
    };

    console.log('Report ready to submit:', report);

    await new Promise((resolve) => setTimeout(resolve, 600));

    setSubmitting(false);
    setStep('success');
  }

  function startNewReport() {
    setPhotoUri(null);
    setLocation(null);
    setCategory(null);
    setDuration(null);
    setDescription('');
    setStep('camera');
  }

  if (step === 'success') {
    return (
      <View style={styles.center}>
        <View style={styles.successCircle}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.title}>Report submitted</Text>
        <Text style={styles.text}>
          Thank you. Your report has been sent and will be reviewed. You can track its status from the map.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={startNewReport}
          accessibilityLabel="Report another problem"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Report another problem</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'details' && photoUri) {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.stepIndicator}>Step 2 of 2</Text>

        <Image source={{ uri: photoUri }} style={styles.preview} accessibilityLabel="Photo of the reported problem" />

        <View style={styles.locationRow}>
          {locating ? (
            <>
              <ActivityIndicator size="small" color="#2c3e50" />
              <Text style={styles.locationText}>Getting your location…</Text>
            </>
          ) : location ? (
            <Text style={styles.locationText}>
              📍 Location captured ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
            </Text>
          ) : (
            <Text style={[styles.locationText, styles.locationError]}>
              ⚠️ Location not captured — you can still submit, but it won't appear on the map
            </Text>
          )}
        </View>

        <Text style={styles.label}>What's the problem?</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.categoryCard, category === c.value && styles.categoryCardSelected]}
              onPress={() => setCategory(c.value)}
              accessibilityLabel={`Category: ${c.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: category === c.value }}
            >
              <Text style={styles.categoryIcon}>{c.icon}</Text>
              <Text style={category === c.value ? styles.categoryTextSelected : styles.categoryText}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>How long has this been there?</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.chip, duration === d.value && styles.chipSelected]}
              onPress={() => setDuration(d.value)}
              accessibilityLabel={`Duration: ${d.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: duration === d.value }}
            >
              <Text style={duration === d.value ? styles.chipTextSelected : styles.chipText}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the problem — what you see, who it affects…"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          accessibilityLabel="Problem description"
        />

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={retake}
          accessibilityLabel="Retake photo"
          accessibilityRole="button"
        >
          <Text style={styles.buttonSecondaryText}>Retake photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={submitReport}
          disabled={submitting}
          accessibilityLabel="Submit report"
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.cameraOverlay} pointerEvents="none">
        <Text style={styles.cameraCaption}>Point the camera at the problem</Text>
      </View>
      <TouchableOpacity
        style={styles.captureButton}
        onPress={takePhoto}
        accessibilityLabel="Take photo"
        accessibilityRole="button"
      >
        <View style={styles.captureInner} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraCaption: { color: '#fff', fontSize: 14, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  text: { fontSize: 15, textAlign: 'center', color: '#555', lineHeight: 21, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  permissionIcon: { fontSize: 48, marginBottom: 16 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e74c3c',
  },
  form: { padding: 20, paddingTop: 50, gap: 14 },
  stepIndicator: { fontSize: 13, fontWeight: '600', color: '#888', letterSpacing: 0.5, textTransform: 'uppercase' },
  preview: { width: '100%', height: 260, borderRadius: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 20 },
  locationText: { fontSize: 13, color: '#555' },
  locationError: { color: '#c0392b' },
  label: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginTop: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  categoryCardSelected: { backgroundColor: '#2c3e50', borderColor: '#2c3e50' },
  categoryIcon: { fontSize: 20 },
  categoryText: { color: '#333', fontSize: 13, fontWeight: '500', flexShrink: 1 },
  categoryTextSelected: { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  chipSelected: { backgroundColor: '#2c3e50', borderColor: '#2c3e50' },
  chipText: { color: '#333', fontSize: 13 },
  chipTextSelected: { color: '#fff', fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonSecondaryText: { color: '#2c3e50', fontWeight: '600', fontSize: 15 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successCheck: { color: '#fff', fontSize: 44, fontWeight: '700' },
});
