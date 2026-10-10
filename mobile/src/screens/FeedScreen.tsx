import { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ReportDetailScreen from './ReportDetailScreen';

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

export type PublicReport = {
  reportId: string;
  category: Category;
  photoUrl: string;
  description: string; // NOTE: not yet in the real reports_public schema — needs backend/privacy sign-off
  location: { lat: number; lng: number };
  ward: string;
  office: string | null; // NOTE: new field, not yet in the schema — tracks which office is handling it
  reportedAt: string;
  status: Status;
  confirmationCount: number;
  upvoteCount: number;
  userHasUpvoted: boolean;
};

export type FeedStackParamList = {
  FeedList: undefined;
  ReportDetail: { report: PublicReport };
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

const MOCK_REPORTS: PublicReport[] = [
  {
    reportId: '1',
    category: 'pothole',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
    description: 'Large pothole on the main road, cars are swerving to avoid it and it gets worse after rain.',
    location: { lat: -0.0917, lng: 37.9816 },
    ward: 'Marimanti',
    office: 'Tharaka Nithi County Roads Department',
    reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: 'in_progress',
    confirmationCount: 0,
    upvoteCount: 34,
    userHasUpvoted: false,
  },
  {
    reportId: '2',
    category: 'water_leak',
    photoUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    description: 'Pipe burst near the market entrance, water has been running for two days.',
    location: { lat: -0.095, lng: 37.98 },
    ward: 'Gatunga',
    office: null,
    reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'received',
    confirmationCount: 0,
    upvoteCount: 12,
    userHasUpvoted: false,
  },
  {
    reportId: '3',
    category: 'garbage_dumping',
    photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
    description: 'Illegal dumping site has grown over the past month, attracting flies and a bad smell near the school.',
    location: { lat: -0.09, lng: 37.985 },
    ward: 'Chiakariga',
    office: 'Chiakariga Ward Office',
    reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: 'pending_confirmation',
    confirmationCount: 2,
    upvoteCount: 58,
    userHasUpvoted: true,
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

function ReportCard({
  report,
  onUpvote,
  onConfirm,
  onPress,
}: {
  report: PublicReport;
  onUpvote: (id: string) => void;
  onConfirm: (id: string) => void;
  onPress: () => void;
}) {
  const category = CATEGORY_META[report.category];
  const status = STATUS_META[report.status];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={`View details for ${category.label} report in ${report.ward}`}>
      <View style={styles.cardHeader}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <View style={styles.cardHeaderText}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <Text style={styles.wardLabel}>{report.ward} · {timeAgo(report.reportedAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
      </View>

      <Image
        source={{ uri: report.photoUrl }}
        style={styles.cardImage}
        accessibilityLabel={`Photo of a ${category.label.toLowerCase()} report`}
      />

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, report.userHasUpvoted && styles.actionButtonActive]}
          onPress={(e) => { e.stopPropagation(); onUpvote(report.reportId); }}
          accessibilityLabel={`Upvote this ${category.label.toLowerCase()} report, currently ${report.upvoteCount} votes`}
          accessibilityRole="button"
        >
          <Text style={[styles.actionIcon, report.userHasUpvoted && styles.actionIconActive]}>▲</Text>
          <Text style={[styles.actionText, report.userHasUpvoted && styles.actionTextActive]}>
            {report.upvoteCount} {report.upvoteCount === 1 ? 'vote' : 'votes'}
          </Text>
        </TouchableOpacity>

        {report.status === 'pending_confirmation' && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={(e) => { e.stopPropagation(); onConfirm(report.reportId); }}
            accessibilityLabel="Confirm this problem has been fixed"
            accessibilityRole="button"
          >
            <Text style={styles.confirmText}>✓ Confirm fixed ({report.confirmationCount})</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function FeedList({ navigation }: NativeStackScreenProps<FeedStackParamList, 'FeedList'>) {
  const [reports, setReports] = useState<PublicReport[]>(MOCK_REPORTS);

  function handleUpvote(id: string) {
    setReports((prev) =>
      prev.map((r) =>
        r.reportId === id
          ? {
              ...r,
              userHasUpvoted: !r.userHasUpvoted,
              upvoteCount: r.userHasUpvoted ? r.upvoteCount - 1 : r.upvoteCount + 1,
            }
          : r
      )
    );
  }

  function handleConfirm(id: string) {
    setReports((prev) =>
      prev.map((r) =>
        r.reportId === id ? { ...r, confirmationCount: r.confirmationCount + 1 } : r
      )
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby reports</Text>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.reportId}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onUpvote={handleUpvote}
            onConfirm={handleConfirm}
            onPress={() => navigation.navigate('ReportDetail', { report: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const Stack = createNativeStackNavigator<FeedStackParamList>();

export default function FeedScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedList" component={FeedList} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  listContent: { padding: 14, gap: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  categoryIcon: { fontSize: 24 },
  cardHeaderText: { flex: 1 },
  categoryLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  wardLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardImage: { width: '100%', height: 220, backgroundColor: '#eee' },
  cardActions: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  actionButtonActive: { backgroundColor: '#2c3e50', borderColor: '#2c3e50' },
  actionIcon: { fontSize: 13, color: '#555' },
  actionIconActive: { color: '#fff' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#555' },
  actionTextActive: { color: '#fff' },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#27ae60',
  },
  confirmText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
