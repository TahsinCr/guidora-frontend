import { describe, it, expect, beforeEach, vi } from 'vitest';
import { networkTracker } from '@/services/api/networkTracker';

describe('NetworkTracker Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly tracks in-flight requests count', () => {
    expect(networkTracker.inFlightCount).toBe(0);

    const decrement1 = networkTracker.incrementInFlight();
    expect(networkTracker.inFlightCount).toBe(1);

    const decrement2 = networkTracker.incrementInFlight();
    expect(networkTracker.inFlightCount).toBe(2);

    decrement1();
    expect(networkTracker.inFlightCount).toBe(1);

    decrement2();
    expect(networkTracker.inFlightCount).toBe(0);
  });

  it('prevents in-flight count from going below 0', () => {
    networkTracker.decrementInFlight();
    networkTracker.decrementInFlight();
    expect(networkTracker.inFlightCount).toBe(0);
  });

  it('waitForInFlight resolves immediately if inFlightCount is 0', async () => {
    expect(networkTracker.inFlightCount).toBe(0);
    const resolved = await Promise.race([
      networkTracker.waitForInFlight().then(() => true),
      new Promise((r) => setTimeout(() => r(false), 50)),
    ]);
    expect(resolved).toBe(true);
  });

  it('waitForInFlight waits until all in-flight requests complete (graceful draining)', async () => {
    const decrement = networkTracker.incrementInFlight();
    expect(networkTracker.inFlightCount).toBe(1);

    let drained = false;
    const drainPromise = networkTracker.waitForInFlight().then(() => {
      drained = true;
    });

    // Should still be waiting while request is in-flight
    await new Promise((r) => setTimeout(r, 20));
    expect(drained).toBe(false);

    // Request completes
    decrement();
    await drainPromise;

    expect(drained).toBe(true);
    expect(networkTracker.inFlightCount).toBe(0);
  });

  it('responds to browser online and offline events', () => {
    window.dispatchEvent(new Event('offline'));
    expect(networkTracker.isOnline).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(networkTracker.isOnline).toBe(true);
  });
});
