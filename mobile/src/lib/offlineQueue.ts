import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'infrawatch_pending_reports';

export type QueuedReport = {
  localId: string; // client-generated, so we can remove it from the queue after sync
  category: string;
  description: string;
  durationEstimate: string;
  photoUrl: string; // local file URI — see cache-eviction caveat in ReportScreen
  location: { lat: number; lng: number };
  ward: string;
  reporterId: string | null;
  reportedAt: string;
  status: string;
  queuedAt: string; // when it was saved locally, distinct from reportedAt
};

export async function getQueuedReports(): Promise<QueuedReport[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addToQueue(report: Omit<QueuedReport, 'localId' | 'queuedAt'>): Promise<void> {
  const queue = await getQueuedReports();
  const queued: QueuedReport = {
    ...report,
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    queuedAt: new Date().toISOString(),
  };
  queue.push(queued);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function removeFromQueue(localId: string): Promise<void> {
  const queue = await getQueuedReports();
  const filtered = queue.filter((r) => r.localId !== localId);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function getQueueCount(): Promise<number> {
  const queue = await getQueuedReports();
  return queue.length;
}

// Placeholder: this is where each queued report actually gets submitted
// once Firestore is live. For now it just logs, same as the online path
// in ReportScreen, and removes the item from the queue as if it succeeded.
// Real version: call the same submit function ReportScreen uses online,
// and only remove from queue on confirmed success — a failed attempt
// should stay queued and retry later, not silently disappear.
export async function flushQueue(): Promise<number> {
  const queue = await getQueuedReports();
  let sentCount = 0;

  for (const report of queue) {
    console.log('Flushing queued report:', report);
    await removeFromQueue(report.localId);
    sentCount++;
  }

  return sentCount;
}
