import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FeedStackParamList } from './FeedScreen';

type Props = NativeStackScreenProps<FeedStackParamList, 'ReportDetail'>;

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
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

const STATUS_META: Record<string, { label: string; color: string }> = {
  received: { label: 'Received', color: '#7f8c8d' },
  verified: { label: 'Verified', color: '#2980b9' },
  funded: { label: 'Funded', color: '#8e44ad' },
  in_progress: { label: 'In progress', color: '#f39c12' },
  pending_confirmation: { label: 'Pending confirmation', color: '#e67e22' },
  resolved: { label: 'Resolved', color: '#27ae60' },
  disputed: { label: 'Disputed', color: '#c0392b' },
};

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { report } = route.params;
  const category = CATEGORY_META[report.category];
  const status = STATUS_META[report.status];

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back to feed"
        accessibilityRole="button"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Image
        source={{ uri: report.photoUrl }}
        style={styles.image}
        accessibilityLabel={`Photo of a ${category.label.toLowerCase()} report`}
      />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryLabel}>{category.label}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.label}</Text>
        </View>

        {report.office && (
          <Text style={styles.officeText}>
            {report.status === 'received'
              ? `Awaiting review`
              : `Handled by ${report.office}`}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📍 {report.ward}</Text>
          <Text style={styles.metaText}>🕐 Reported {timeAgo(report.reportedAt)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{report.description}</Text>

        <Text style={styles.sectionLabel}>Approximate location</Text>
        <Text style={styles.locationText}>
          {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
        </Text>
        <Text style={styles.locationNote}>
          Location shown is approximate to protect the reporter's privacy.
        </Text>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>▲ {report.upvoteCount} {report.upvoteCount === 1 ? 'vote' : 'votes'}</Text>
          {report.confirmationCount > 0 && (
            <Text style={styles.statText}>✓ {report.confirmationCount} confirmed fixed</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { position: 'absolute', top: 50, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  backText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  image: { width: '100%', height: 320, backgroundColor: '#eee' },
  content: { padding: 20, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { fontSize: 28 },
  categoryLabel: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  officeText: { fontSize: 13, color: '#555', fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaText: { fontSize: 13, color: '#777' },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginTop: 10 },
  description: { fontSize: 15, color: '#333', lineHeight: 21 },
  locationText: { fontSize: 14, color: '#333' },
  locationNote: { fontSize: 12, color: '#999' },
  statsRow: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#eee' },
  statText: { fontSize: 14, fontWeight: '600', color: '#555' },
});
