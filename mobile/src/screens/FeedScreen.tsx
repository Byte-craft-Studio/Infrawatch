import { View, Text, StyleSheet } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>📰</Text>
      <Text style={styles.title}>Feed</Text>
      <Text style={styles.text}>Nearby reports from other citizens will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  text: { fontSize: 14, color: '#777', textAlign: 'center' },
});
