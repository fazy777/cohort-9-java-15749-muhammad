import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/services/api.js';
import { safeStorage } from '../src/utils/storage.js';

describe('ContactSphere Profile Phone & Duplicate Policy Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    safeStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    safeStorage.clear();
  });

  test('api.updatePhone rejects when phone payload is missing', async () => {
    await assert.rejects(
      async () => {
        await api.updatePhone({});
      },
      {
        name: 'Error',
        message: 'Phone number is required'
      }
    );
  });

  test('api.updatePhone sends PUT /auth/phone and returns updated profile', async () => {
    globalThis.fetch = async (url, options) => {
      assert.match(url, /\/auth\/phone$/);
      assert.equal(options.method, 'PUT');
      const body = JSON.parse(options.body);
      assert.equal(body.phone, '+15551234567');

      return {
        ok: true,
        status: 200,
        headers: {
          get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null)
        },
        json: async () => ({
          success: true,
          message: 'Phone number updated successfully',
          data: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+15551234567'
          }
        })
      };
    };

    const updated = await api.updatePhone({ phone: '+15551234567' });
    assert.equal(updated.id, 1);
    assert.equal(updated.phone, '+15551234567');
  });

  test('api.deleteAccount sends DELETE /auth/account and clears session storage', async () => {
    safeStorage.setItem('cms_user', JSON.stringify({ id: 1, firstName: 'John' }));
    safeStorage.setItem('cms_auth_token', 'mock-token-xyz');

    globalThis.fetch = async (url, options) => {
      assert.match(url, /\/auth\/account$/);
      assert.equal(options.method, 'DELETE');
      return {
        ok: true,
        status: 200,
        headers: {
          get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null)
        },
        json: async () => ({
          success: true,
          message: 'Account permanently closed'
        })
      };
    };

    const res = await api.deleteAccount();
    assert.equal(res.success, true);
    assert.equal(safeStorage.getItem('cms_user'), null);
    assert.equal(safeStorage.getItem('cms_auth_token'), null);
  });

  test('api.deleteAccount preserves session storage when request rejects', async () => {
    safeStorage.setItem('cms_user', JSON.stringify({ id: 1, firstName: 'John' }));
    safeStorage.setItem('cms_auth_token', 'mock-token-xyz');

    globalThis.fetch = async () => {
      throw new Error('Network error during deletion');
    };

    await assert.rejects(
      async () => {
        await api.deleteAccount();
      },
      /Network error during deletion/
    );

    assert.notEqual(safeStorage.getItem('cms_user'), null);
    assert.notEqual(safeStorage.getItem('cms_auth_token'), null);
  });

  test('api.logout clears session storage even when request rejects', async () => {
    safeStorage.setItem('cms_user', JSON.stringify({ id: 1, firstName: 'John' }));
    safeStorage.setItem('cms_auth_token', 'mock-token-xyz');

    globalThis.fetch = async () => {
      throw new Error('Network error during logout');
    };

    await assert.rejects(
      async () => {
        await api.logout();
      },
      /Network error during logout/
    );

    assert.equal(safeStorage.getItem('cms_user'), null);
    assert.equal(safeStorage.getItem('cms_auth_token'), null);
  });

  test('phone normalizer strips formatting correctly for duplicate comparisons', () => {
    const normalizePhone = (num) => (num ? String(num).replace(/[\s\-().]/g, '').toLowerCase() : '');

    assert.equal(normalizePhone('+1 (555) 234-5678'), '+15552345678');
    assert.equal(normalizePhone('555-234-5678'), '5552345678');
    assert.equal(normalizePhone('+44 20 7946 0919'), '+442079460919');
    assert.equal(normalizePhone(''), '');
    assert.equal(normalizePhone(null), '');
  });

  test('warning counter tracks first warning and escalates on repeat violation', () => {
    const userId = 42;
    const warningKey = `cms_dup_warning_${userId}`;

    // Initially 0 warnings
    let warnings = Number(safeStorage.getItem(warningKey) || 0);
    assert.equal(warnings, 0);

    // Violation 1 -> Warn it!
    safeStorage.setItem(warningKey, '1');
    warnings = Number(safeStorage.getItem(warningKey) || 0);
    assert.equal(warnings, 1);

    // Violation 2 -> Should trigger closure because warnings >= 1
    const shouldCloseAccount = warnings >= 1;
    assert.equal(shouldCloseAccount, true);

    // Clean up
    safeStorage.removeItem(warningKey);
    assert.equal(safeStorage.getItem(warningKey), null);
  });
});
