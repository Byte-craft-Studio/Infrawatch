import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      const state = await Network.getNetworkStateAsync();
      if (mounted) {
        setIsConnected(!!state.isConnected && !!state.isInternetReachable);
      }
    }

    checkStatus();
    // Poll every 5s rather than relying solely on a one-time check —
    // expo-network doesn't currently offer a subscription-based listener
    // the way @react-native-community/netinfo does, so polling is the
    // pragmatic choice here without adding another dependency.
    const interval = setInterval(checkStatus, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}
