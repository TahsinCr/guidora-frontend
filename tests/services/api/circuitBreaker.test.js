import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { circuitBreaker, CIRCUIT_STATE } from '@/services/api/circuitBreaker';

describe('CircuitBreaker Service', () => {
  beforeEach(() => {
    circuitBreaker.reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    circuitBreaker.reset();
  });

  it('starts in CLOSED state with 0 failures', () => {
    expect(circuitBreaker.state).toBe(CIRCUIT_STATE.CLOSED);
    expect(circuitBreaker.consecutiveFailures).toBe(0);
    expect(circuitBreaker.canRequest()).toBe(true);
  });

  it('stays in CLOSED state when failures are below threshold', () => {
    circuitBreaker.recordFailure(new Error('Network error 1'));
    circuitBreaker.recordFailure(new Error('Network error 2'));
    circuitBreaker.recordFailure(new Error('Network error 3'));

    expect(circuitBreaker.state).toBe(CIRCUIT_STATE.CLOSED);
    expect(circuitBreaker.consecutiveFailures).toBe(3);
    expect(circuitBreaker.canRequest()).toBe(true);
  });

  it('trips to OPEN state when consecutive failures reach threshold (5)', () => {
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure(new Error(`Failure ${i + 1}`));
    }

    expect(circuitBreaker.state).toBe(CIRCUIT_STATE.OPEN);
    expect(circuitBreaker.consecutiveFailures).toBe(5);
    expect(circuitBreaker.canRequest()).toBe(false);
  });

  it('resets consecutive failures to 0 upon any successful request in CLOSED state', () => {
    circuitBreaker.recordFailure(new Error('Temporary glitch'));
    circuitBreaker.recordFailure(new Error('Temporary glitch 2'));
    expect(circuitBreaker.consecutiveFailures).toBe(2);

    circuitBreaker.recordSuccess();
    expect(circuitBreaker.consecutiveFailures).toBe(0);
    expect(circuitBreaker.state).toBe(CIRCUIT_STATE.CLOSED);
  });

  it('notifies subscribers and dispatches CustomEvent on state change', () => {
    const subscriber = vi.fn();
    const unsubscribe = circuitBreaker.subscribe(subscriber);

    // Initial subscribe call
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ state: CIRCUIT_STATE.CLOSED, isOpen: false })
    );

    // Trip the breaker
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure(new Error('Crash'));
    }

    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: CIRCUIT_STATE.OPEN, isOpen: true })
    );

    unsubscribe();
  });

  it('recovers to CLOSED state when health check probe succeeds', async () => {
    // Trip to OPEN
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure(new Error('Down'));
    }
    expect(circuitBreaker.state).toBe(CIRCUIT_STATE.OPEN);

    // Mock fetch for /health/live returning 200 OK
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    await circuitBreaker.probeHealth();

    expect(circuitBreaker.state).toBe(CIRCUIT_STATE.CLOSED);
    expect(circuitBreaker.consecutiveFailures).toBe(0);
    expect(circuitBreaker.canRequest()).toBe(true);
  });
});
