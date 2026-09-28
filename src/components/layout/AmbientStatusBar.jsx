import { useState, useEffect, useRef } from 'react';
import { networkTracker } from '@/services/api/networkTracker';
import { circuitBreaker, CIRCUIT_STATE } from '@/services/api/circuitBreaker';
import styles from './AmbientStatusBar.module.scss';

export default function AmbientStatusBar({ isNavigating = false }) {
  const [isOffline, setIsOffline] = useState(() => !networkTracker.isOnline);
  const [isOutage, setIsOutage] = useState(() => circuitBreaker.state === CIRCUIT_STATE.OPEN);
  const [isRecovered, setIsRecovered] = useState(false);

  const prevOfflineRef = useRef(isOffline);
  const prevOutageRef = useRef(isOutage);

  useEffect(() => {
    // 1. Subscribe to network status changes (online/offline)
    const unsubNetwork = networkTracker.subscribe(({ isOnline }) => {
      const offlineNow = !isOnline;
      if (prevOfflineRef.current && !offlineNow) {
        // Just recovered from offline!
        triggerRecovered();
      }
      prevOfflineRef.current = offlineNow;
      setIsOffline(offlineNow);
    });

    // 2. Subscribe to circuit breaker (backend outage)
    const unsubBreaker = circuitBreaker.subscribe(({ state }) => {
      const outageNow = state === CIRCUIT_STATE.OPEN;
      if (prevOutageRef.current && !outageNow && state === CIRCUIT_STATE.CLOSED) {
        // Just recovered from outage!
        triggerRecovered();
      }
      prevOutageRef.current = outageNow;
      setIsOutage(outageNow);
    });

    return () => {
      unsubNetwork();
      unsubBreaker();
    };
  }, []);

  const triggerRecovered = () => {
    setIsRecovered(true);
    setTimeout(() => {
      setIsRecovered(false);
    }, 2500);
  };

  // Determine state priority:
  // 1. Backend Outage (Red)
  // 2. Offline (Yellow)
  // 3. Recovered (Green temporary)
  // 4. Navigating (Purple/Blue shimmer)
  let statusClass = '';
  if (isOutage) {
    statusClass = styles.outage;
  } else if (isOffline) {
    statusClass = styles.offline;
  } else if (isRecovered) {
    statusClass = styles.recovered;
  } else if (isNavigating) {
    statusClass = styles.navigating;
  }

  if (!statusClass) return null;

  return (
    <div
      className={`${styles.statusBar} ${statusClass}`}
      role="progressbar"
      aria-hidden="true"
    />
  );
}
