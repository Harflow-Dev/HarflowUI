import assert from 'node:assert/strict';
import test from 'node:test';
import { ReadHostInformation } from '../src/application/index.js';
import { HostPresenter } from '../src/presentation/index.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

void test('constructor-injected host port drives immutable snapshots and subscriptions', async () => {
  const read = { read: async () => ({ application: 'Harflow', version: '1' }) };
  const useCase = new ReadHostInformation(read);
  const presenter = new HostPresenter(useCase);
  const states: string[] = [];
  const unsubscribe = presenter.subscribe(() =>
    states.push(presenter.getSnapshot().status),
  );

  assert.deepEqual(presenter.getSnapshot(), { status: 'idle' });
  await presenter.refresh();

  assert.deepEqual(states, ['loading', 'ready']);
  assert.deepEqual(presenter.getSnapshot(), {
    status: 'ready',
    information: { application: 'Harflow', version: '1' },
  });
  const snapshot = presenter.getSnapshot();
  assert.ok(Object.isFrozen(snapshot));
  if (snapshot.status === 'ready')
    assert.ok(Object.isFrozen(snapshot.information));
  unsubscribe();
  presenter.dispose();
});

void test('newer refresh wins when an older request completes last', async () => {
  const first = deferred<{ application: string; version: string }>();
  const second = deferred<{ application: string; version: string }>();
  let calls = 0;
  const presenter = new HostPresenter({
    execute: () => (++calls === 1 ? first.promise : second.promise),
  });

  const olderRefresh = presenter.refresh();
  const newerRefresh = presenter.refresh();
  second.resolve({ application: 'new', version: '2' });
  await newerRefresh;
  first.resolve({ application: 'stale', version: '1' });
  await olderRefresh;

  assert.deepEqual(presenter.getSnapshot(), {
    status: 'ready',
    information: { application: 'new', version: '2' },
  });
  presenter.dispose();
});

void test('disposal suppresses a pending completion and future refreshes', async () => {
  const pending = deferred<{ application: string; version: string }>();
  const presenter = new HostPresenter({ execute: () => pending.promise });
  let notifications = 0;
  presenter.subscribe(() => notifications++);
  const refresh = presenter.refresh();
  assert.equal(presenter.getSnapshot().status, 'loading');
  presenter.dispose();
  pending.resolve({ application: 'late', version: '1' });
  await refresh;
  await presenter.refresh();

  assert.equal(notifications, 1);
  assert.equal(presenter.getSnapshot().status, 'loading');
});

void test('read failures become explicit errors without leaking non-Error values', async () => {
  const presenter = new HostPresenter({
    execute: async () => {
      throw new Error('offline');
    },
  });
  await presenter.refresh();
  assert.deepEqual(presenter.getSnapshot(), {
    status: 'error',
    message: 'offline',
  });

  const unknownFailure = new HostPresenter({
    execute: async () => {
      throw 'secret';
    },
  });
  await unknownFailure.refresh();
  assert.deepEqual(unknownFailure.getSnapshot(), {
    status: 'error',
    message: 'Host information unavailable',
  });
  presenter.dispose();
  unknownFailure.dispose();
});
