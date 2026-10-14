import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';

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

type MyReport = {
  reportId: string;
  category: Category;
  photoUrl: string;
  reportedAt: string;
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

const STATUS_META: Record<Status, { label: string; color: string }> = {
  received: { label: 'Received', color: '#7f8c8d' },
  verified: { label: 'Verified', color: '#2980b9' },
  funded: { label: 'Funded', color: '#8e44ad' },
  in_progress: { label: 'In progress', color: '#f39c12' },
  pending_confirmation: { label: 'Pending confirmation', color: '#e67e22' },
  resolved: { label: 'Resolved', color: '#27ae60' },
  disputed: { label: 'Disputed', color: '#c0392b' },
};

// Placeholder mock data for the signed-in citizen's own reports.
// Real version: query reports_private where reporterId == current user's UID.
const MY_REPORTS: MyReport[] = [
  {
    reportId: '1',
    category: 'pothole',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
    reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: 'in_progress',
  },
  {
    reportId: '2',
    category: 'garbage_dumping',
    photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    status: 'resolved',
  },
];

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

function MyReportRow({ report }: { report: MyReport }) {
  const category = CATEGORY_META[report.category];
  const status = STATUS_META[report.status];

  return (
    <TouchableOpacity style={styles.row} accessibilityRole="button" accessibilityLabel={`${category.label} report, ${status.label}`}>
      <Image source={{ uri: report.photoUrl }} style={styles.thumb} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{category.icon} {category.label}</Text>
        <Text style={styles.rowMeta}>Reported {timeAgo(report.reportedAt)}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
        <Text style={styles.statusText}>{status.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const resolvedCount = MY_REPORTS.filter((r) => r.status === 'resolved').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.headerTitle}>Anonymous citizen</Text>
        <Text style={styles.headerSubtitle}>Signed in anonymously</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{MY_REPORTS.length}</Text>
            <Text style={styles.statLabel}>Reports made</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Your reports</Text>

      {MY_REPORTS.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You haven't reported anything yet.</Text>
        </View>
      ) : (
        <FlatList
          data={MY_REPORTS}
          keyExtractor={(item) => item.reportId}
          renderItem={({ item }) => <MyReportRow report={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { backgroundColor: '#fff', paddingTop: 56, paddingBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 16 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#2c3e50' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', padding: 16, paddingBottom: 8 },
  listContent: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, gap: 10, marginBottom: 10 },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee' },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  rowMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },
});
