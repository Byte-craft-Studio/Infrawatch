import { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MapView, { Marker, UrlTile, Callout } from 'react-native-maps';

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

type Status = 'received' | 'verified' | 'funded' | 'in_progress' | 'pending_confirmation' | 'resolved' | 'disputed';

type MapReport = {
  reportId: string;
  category: Category;
  photoUrl: string;
  location: { lat: number; lng: number }; // fuzzed, from reports_public
  ward: string;
  status: Status;
};

const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  pothole: { label: 'Pothole', icon: '🕳️' },
  broken_light: { label: 'Broken light', icon: '💡' },
  water_leak: { label: 'Water leak', icon: '💧' },
  blocked_drainage: { label: 'Blocked drainage', icon: '🚰' },
  garbage_dumping: { label: 'Garbage dumping', icon: '🗑️' },
  damaged_road: { label: 'Damaged road', icon: '🛣️' },
  fallen_tree: { label: 'Fallen tree', icon: '🌳' },
  broken_signage: { label: 'Broken sign/light', icon: '🚦' },
  flooding: { label: 'Flooding', icon: '🌊' },
  other: { label: 'Other', icon: '❓' },
};

// Pin color reflects status, not category — on a map, "is this fixed yet"
// matters more at a glance than "what kind of problem is it".
const STATUS_PIN_COLOR: Record<Status, string> = {
  received: '#7f8c8d',
  verified: '#2980b9',
  funded: '#8e44ad',
  in_progress: '#f39c12',
  pending_confirmation: '#e67e22',
  resolved: '#27ae60',
  disputed: '#c0392b',
};

// Placeholder mock data, shaped like reports_public (fuzzed coordinates).
// Real version: Firestore query against reports_public, ideally scoped to
// the visible map region rather than loading every report nationwide.
const MOCK_MAP_REPORTS: MapReport[] = [
  {
    reportId: '1',
    category: 'pothole',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
    location: { lat: -0.0917, lng: 37.9816 },
    ward: 'Marimanti',
    status: 'in_progress',
  },
  {
    reportId: '2',
    category: 'water_leak',
    photoUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
    location: { lat: -0.095, lng: 37.98 },
    ward: 'Gatunga',
    status: 'received',
  },
  {
    reportId: '3',
    category: 'garbage_dumping',
    photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    location: { lat: -0.09, lng: 37.985 },
    ward: 'Chiakariga',
    status: 'pending_confirmation',
  },
];

// Tharaka area, roughly centered on the mock data above.
const INITIAL_REGION = {
  latitude: -0.0917,
  longitude: 37.9816,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const [reports] = useState<MapReport[]>(MOCK_MAP_REPORTS);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={INITIAL_REGION}>
        {/* OpenStreetMap tiles — free, no API key, matches the architecture decision from earlier */}
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />

        {reports.map((report) => {
          const category = CATEGORY_META[report.category];
          return (
            <Marker
              key={report.reportId}
              coordinate={{ latitude: report.location.lat, longitude: report.location.lng }}
              pinColor={STATUS_PIN_COLOR[report.status]}
              accessibilityLabel={`${category.label} report in ${report.ward}`}
            >
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  <Image source={{ uri: report.photoUrl }} style={styles.calloutImage} />
                  <Text style={styles.calloutTitle}>{category.icon} {category.label}</Text>
                  <Text style={styles.calloutMeta}>{report.ward}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status</Text>
        {Object.entries(STATUS_PIN_COLOR).slice(0, 4).map(([status, color]) => (
          <View key={status} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{status.replace('_', ' ')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  callout: { width: 140, alignItems: 'center' },
  calloutImage: { width: 120, height: 80, borderRadius: 6, marginBottom: 4 },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  calloutMeta: { fontSize: 11, color: '#888' },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: { fontSize: 11, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#555', textTransform: 'capitalize' },
});
