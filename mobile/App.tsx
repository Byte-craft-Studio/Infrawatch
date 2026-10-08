import { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, ScrollView, Alert } from 'react-native';
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

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Pothole', value: 'pothole' },
  { label: 'Broken light', value: 'broken_light' },
  { label: 'Water leak', value: 'water_leak' },
  { label: 'Blocked drainage', value: 'blocked_drainage' },
  { label: 'Garbage dumping', value: 'garbage_dumping' },
  { label: 'Damaged road', value: 'damaged_road' },
  { label: 'Fallen tree', value: 'fallen_tree' },
  { label: 'Broken sign/traffic light', value: 'broken_signage' },
  { label: 'Flooding', value: 'flooding' },
  { label: 'Other', value: 'other' },
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

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!permission) {
    return <View style={styles.center}><Text>Checking camera permission…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>InfraWatch needs camera access to report a problem.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync();
    if (!photo) return;
    setPhotoUri(photo.uri);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location needed', 'InfraWatch needs your location to place this report on the map.');
      return;
    }

    const position = await Location.getCurrentPositionAsync({});
    setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
  }

  function retake() {
    setPhotoUri(null);
    setLocation(null);
  }

  async function submitReport() {
    if (!photoUri || !location || !category) {
      Alert.alert('Missing info', 'Please take a photo and select a category before submitting.');
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
      photoUrl: photoUri, // local URI for now; will be a Storage URL after upload
      location,
      ward: '', // reserved, empty in v1
      reporterId: null, // anonymous for now
      reportedAt: new Date().toISOString(), // placeholder; Firestore will use serverTimestamp()
      status: 'received',
    };

    console.log('Report ready to submit:', report);

    await new Promise((resolve) => setTimeout(resolve, 500));

    setSubmitting(false);
    Alert.alert('Report ready', 'This is placeholder data — see the console log. Firestore comes next.');

    setPhotoUri(null);
    setLocation(null);
    setCategory(null);
    setDuration(null);
    setDescription('');
  }

  if (photoUri) {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        <Image source={{ uri: photoUri }} style={styles.preview} />

        <Text style={styles.label}>
          {location ? `Location captured (${location.lat.toFixed(5)}, ${location.lng.toFixed(5)})` : 'Getting location…'}
        </Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.categoryChip, category === c.value && styles.categoryChipSelected]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={category === c.value ? styles.categoryTextSelected : styles.categoryText}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>How long has this been there?</Text>
        <View style={styles.categoryRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.categoryChip, duration === d.value && styles.categoryChipSelected]}
              onPress={() => setDuration(d.value)}
            >
              <Text style={duration === d.value ? styles.categoryTextSelected : styles.categoryText}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the problem — what you see, who it affects…"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.buttonSecondary} onPress={retake}>
          <Text style={styles.buttonText}>Retake photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={submitReport}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Submitting…' : 'Submit report'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
        <View style={styles.captureInner} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
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
  form: { padding: 20, paddingTop: 60, gap: 12 },
  preview: { width: '100%', height: 300, borderRadius: 8 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categoryChipSelected: { backgroundColor: '#2c3e50', borderColor: '#2c3e50' },
  categoryText: { color: '#333' },
  categoryTextSelected: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSecondary: {
    backgroundColor: '#7f8c8d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
