import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSessionGeneration,
  incrementSessionGeneration,
  resetSessionGeneration,
  handleUnauthorized
} from '../src/services/api.js';
import { safeStorage } from '../src/utils/storage.js';

describe('Authentication Session-Generation Race Condition Protection', () => {
  const originalWindow = globalThis.window;
  let dispatchedEvents = [];

  beforeEach(() => {
    resetSessionGeneration(0);
    safeStorage.clear();
    dispatchedEvents = [];

    globalThis.window = {
      dispatchEvent: (event) => {
        dispatchedEvents.push(event);
      },
      sessionStorage: {
        _data: new Map(),
        getItem(key) {
          return this._data.get(key) ?? null;
        },
        setItem(key, value) {
          this._data.set(key, String(value));
        },
        removeItem(key) {
          this._data.delete(key);
        },
        clear() {
          this._data.clear();
        },
        key(index) {
          return Array.from(this._data.keys())[index] ?? null;
        },
        get length() {
          return this._data.size;
        }
      }
    };
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, eventInitDict = {}) {
        this.type = type;
        this.detail = eventInitDict.detail || null;
      }
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    safeStorage.clear();
  });

  test('increments session generation correctly on auth state change', () => {
    assert.equal(getSessionGeneration(), 0);
    const gen1 = incrementSessionGeneration();
    assert.equal(gen1, 1);
    assert.equal(getSessionGeneration(), 1);

    const gen2 = incrementSessionGeneration();
    assert.equal(gen2, 2);
    assert.equal(getSessionGeneration(), 2);
  });

  test('handleUnauthorized dispatches event and clears storage when generation matches current', () => {
    const gen = incrementSessionGeneration(); // gen = 1
    safeStorage.setItem('cms_user', JSON.stringify({ id: 1, firstName: 'Alice' }));

    handleUnauthorized(gen);

    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0].type, 'auth:unauthorized');
    assert.equal(dispatchedEvents[0].detail?.generation, 1);
    assert.equal(safeStorage.getItem('cms_user'), null);
  });

  test('handleUnauthorized discards stale 401 when request generation is older than current session', () => {
    const requestGen = getSessionGeneration(); // gen = 0 (e.g. unauthenticated)
    incrementSessionGeneration(); // user logged in -> gen = 1
    safeStorage.setItem('cms_user', JSON.stringify({ id: 2, firstName: 'Bob' }));

    // Stale 401 returns from earlier request with generation 0
    handleUnauthorized(requestGen);

    // Stale 401 should NOT dispatch auth:unauthorized and should NOT clear the new session
    assert.equal(dispatchedEvents.length, 0);
    assert.notEqual(safeStorage.getItem('cms_user'), null);
    const currentUser = JSON.parse(safeStorage.getItem('cms_user'));
    assert.equal(currentUser.firstName, 'Bob');
  });

  test('Scenario A: Delayed unauthenticated request followed by login does NOT log out new session', async () => {
    // 1. Initial unauthenticated state with generation 0
    assert.equal(getSessionGeneration(), 0);

    // 2. An unauthenticated profile request starts and captures generation 0
    const inFlightRequestGeneration = getSessionGeneration();
    assert.equal(inFlightRequestGeneration, 0);

    // 3. User successfully logs in
    const userAlice = { id: 101, firstName: 'Alice', email: 'alice@example.com' };
    incrementSessionGeneration(); // Generation advances to 1
    safeStorage.setItem('cms_user', JSON.stringify(userAlice));
    assert.equal(getSessionGeneration(), 1);

    // 4. Old in-flight profile request finally returns 401
    handleUnauthorized(inFlightRequestGeneration);

    // 5. Verify the old 401 is discarded and does not destroy Alice's session
    assert.equal(dispatchedEvents.length, 0);
    const activeSessionUser = JSON.parse(safeStorage.getItem('cms_user'));
    assert.equal(activeSessionUser.id, 101);
    assert.equal(activeSessionUser.firstName, 'Alice');
  });

  test('Scenario B: User A -> logout -> User B does NOT allow User A delayed profile to overwrite User B', async () => {
    // 1. User A logs in
    incrementSessionGeneration(); // gen = 1
    const userA = { id: 1, firstName: 'UserA', email: 'a@example.com' };
    safeStorage.setItem('cms_user', JSON.stringify(userA));
    assert.equal(getSessionGeneration(), 1);

    // 2. User A starts a profile fetch request
    const userARequestGen = getSessionGeneration(); // captures gen = 1

    // 3. User A logs out
    incrementSessionGeneration(); // gen = 2
    safeStorage.removeItem('cms_user');
    assert.equal(getSessionGeneration(), 2);
    assert.equal(safeStorage.getItem('cms_user'), null);

    // 4. User B logs in
    incrementSessionGeneration(); // gen = 3
    const userB = { id: 2, firstName: 'UserB', email: 'b@example.com' };
    safeStorage.setItem('cms_user', JSON.stringify(userB));
    assert.equal(getSessionGeneration(), 3);

    // 5. User A delayed profile response arrives
    const staleProfileResponse = { id: 1, firstName: 'UserA_Delayed', email: 'a@example.com' };

    // Simulate AuthContext profile resolution check:
    let displayedUser = userB;
    if (userARequestGen === getSessionGeneration()) {
      // Should NOT enter here because 1 !== 3
      displayedUser = staleProfileResponse;
      safeStorage.setItem('cms_user', JSON.stringify(staleProfileResponse));
    }

    // 6. Verify User A response was discarded and User B remains the current active user
    assert.equal(displayedUser.id, 2);
    assert.equal(displayedUser.firstName, 'UserB');
    const storedUser = JSON.parse(safeStorage.getItem('cms_user'));
    assert.equal(storedUser.id, 2);
    assert.equal(storedUser.firstName, 'UserB');
  });

  test('AuthContext unauthorized event listener ignores older generation events', () => {
    let loggedOut = false;
    const currentGeneration = incrementSessionGeneration(); // gen = 1

    const handleUnauthorizedEvent = (event) => {
      const eventGen = event?.detail?.generation;
      if (typeof eventGen === 'number' && eventGen < getSessionGeneration()) {
        return;
      }
      loggedOut = true;
    };

    // Stale event from generation 0
    handleUnauthorizedEvent({ detail: { generation: 0 } });
    assert.equal(loggedOut, false);

    // Valid event from current generation 1
    handleUnauthorizedEvent({ detail: { generation: currentGeneration } });
    assert.equal(loggedOut, true);
  });

  test('Scenario C: Delayed login response arriving after logout does NOT restore authenticated user', async () => {
    // 1. Initial unauthenticated state
    assert.equal(getSessionGeneration(), 0);

    // 2. User starts Login A -> advances generation to 1
    const loginRequestGen = incrementSessionGeneration();
    assert.equal(loginRequestGen, 1);
    assert.equal(getSessionGeneration(), 1);

    // 3. User cancels / logs out before Login A completes -> advances generation to 2
    incrementSessionGeneration();
    safeStorage.removeItem('cms_user');
    assert.equal(getSessionGeneration(), 2);
    assert.equal(safeStorage.getItem('cms_user'), null);

    // 4. Delayed Login A response arrives with user payload
    const userA = { id: 1, firstName: 'Alice', email: 'alice@example.com' };
    let activeUser = null;

    // Simulate AuthContext login resolution check
    if (loginRequestGen === getSessionGeneration()) {
      activeUser = userA;
      safeStorage.setItem('cms_user', JSON.stringify(userA));
    }

    // 5. Verify response was rejected/ignored and user remains unauthenticated
    assert.equal(activeUser, null);
    assert.equal(safeStorage.getItem('cms_user'), null);
  });

  test('Scenario D: Slower login A response arriving after newer login B does NOT overwrite login B', async () => {
    // 1. User starts Login A -> generation 1
    const loginAGen = incrementSessionGeneration();
    assert.equal(loginAGen, 1);

    // 2. User switches credentials and starts Login B -> generation 2
    const loginBGen = incrementSessionGeneration();
    assert.equal(loginBGen, 2);

    // 3. Login B resolves first
    const userB = { id: 2, firstName: 'Bob', email: 'bob@example.com' };
    let activeUser = null;

    if (loginBGen === getSessionGeneration()) {
      activeUser = userB;
      safeStorage.setItem('cms_user', JSON.stringify(userB));
    }
    assert.equal(activeUser.firstName, 'Bob');
    assert.equal(JSON.parse(safeStorage.getItem('cms_user')).firstName, 'Bob');

    // 4. Stale Login A resolves later
    const userA = { id: 1, firstName: 'Alice', email: 'alice@example.com' };
    if (loginAGen === getSessionGeneration()) {
      activeUser = userA;
      safeStorage.setItem('cms_user', JSON.stringify(userA));
    }

    // 5. Verify Login A was discarded and Bob remains the active user
    assert.equal(activeUser.id, 2);
    assert.equal(activeUser.firstName, 'Bob');
    const stored = JSON.parse(safeStorage.getItem('cms_user'));
    assert.equal(stored.id, 2);
    assert.equal(stored.firstName, 'Bob');
  });

  test('Scenario E: Delayed register response arriving after logout does NOT restore user', async () => {
    // 1. User starts Register -> generation 1
    const registerRequestGen = incrementSessionGeneration();
    assert.equal(registerRequestGen, 1);

    // 2. User logs out or resets -> generation 2
    incrementSessionGeneration();
    safeStorage.removeItem('cms_user');
    assert.equal(getSessionGeneration(), 2);

    // 3. Delayed Register response arrives
    const newUser = { id: 10, firstName: 'Charlie', email: 'charlie@example.com' };
    let activeUser = null;

    if (registerRequestGen === getSessionGeneration()) {
      activeUser = newUser;
      safeStorage.setItem('cms_user', JSON.stringify(newUser));
    }

    // 4. Verify Register response is discarded
    assert.equal(activeUser, null);
    assert.equal(safeStorage.getItem('cms_user'), null);
  });

  test('Scenario F: Slower register response arriving after newer register does NOT overwrite active user', async () => {
    // 1. Register Attempt 1 -> generation 1
    const reg1Gen = incrementSessionGeneration();
    assert.equal(reg1Gen, 1);

    // 2. Register Attempt 2 -> generation 2
    const reg2Gen = incrementSessionGeneration();
    assert.equal(reg2Gen, 2);

    // 3. Register Attempt 2 completes first
    const user2 = { id: 20, firstName: 'Diana', email: 'diana@example.com' };
    let activeUser = null;
    if (reg2Gen === getSessionGeneration()) {
      activeUser = user2;
      safeStorage.setItem('cms_user', JSON.stringify(user2));
    }

    // 4. Register Attempt 1 completes later
    const user1 = { id: 10, firstName: 'David', email: 'david@example.com' };
    if (reg1Gen === getSessionGeneration()) {
      activeUser = user1;
      safeStorage.setItem('cms_user', JSON.stringify(user1));
    }

    // 5. Verify user 2 remains active and stored
    assert.equal(activeUser.id, 20);
    assert.equal(activeUser.firstName, 'Diana');
    const stored = JSON.parse(safeStorage.getItem('cms_user'));
    assert.equal(stored.id, 20);
    assert.equal(stored.firstName, 'Diana');
  });
});
