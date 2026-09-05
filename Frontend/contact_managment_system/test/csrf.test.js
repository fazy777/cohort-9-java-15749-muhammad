import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCsrfToken,
  normalizeApiUrl,
  isLocalHostname,
  isLocalOrSecureUrl,
  request
} from '../src/services/api.js';
import { safeStorage } from '../src/utils/storage.js';

describe('normalizeApiUrl', () => {
  test('handles null, undefined, empty string', () => {
    assert.equal(normalizeApiUrl(null), 'http://localhost:8080/api');
    assert.equal(normalizeApiUrl(undefined), 'http://localhost:8080/api');
    assert.equal(normalizeApiUrl(''), 'http://localhost:8080/api');
    assert.equal(normalizeApiUrl('   '), 'http://localhost:8080/api');
  });

  test('prepends https:// when domain is provided without protocol', () => {
    assert.equal(
      normalizeApiUrl('cohort-9-java-15749-muhammad-production.up.railway.app'),
      'https://cohort-9-java-15749-muhammad-production.up.railway.app/api'
    );
  });

  test('preserves existing https:// and appends /api', () => {
    assert.equal(
      normalizeApiUrl('https://cohort-9-java-15749-muhammad-production.up.railway.app'),
      'https://cohort-9-java-15749-muhammad-production.up.railway.app/api'
    );
  });

  test('upgrades insecure non-local http:// to https://', () => {
    assert.equal(
      normalizeApiUrl('http://cohort-9-java-15749-muhammad-production.up.railway.app'),
      'https://cohort-9-java-15749-muhammad-production.up.railway.app/api'
    );
    assert.equal(
      normalizeApiUrl('http://api.mysite.com/api'),
      'https://api.mysite.com/api'
    );
  });

  test('preserves local http:// origins for development', () => {
    assert.equal(normalizeApiUrl('http://localhost:8080'), 'http://localhost:8080/api');
    assert.equal(normalizeApiUrl('http://localhost:8080/api'), 'http://localhost:8080/api');
    assert.equal(normalizeApiUrl('http://127.0.0.1:8080'), 'http://127.0.0.1:8080/api');
    assert.equal(normalizeApiUrl('http://[::1]:8080'), 'http://[::1]:8080/api');
    assert.equal(normalizeApiUrl('http://app.localhost:3000'), 'http://app.localhost:3000/api');
  });

  test('preserves same-origin relative URLs', () => {
    assert.equal(normalizeApiUrl('/api'), '/api');
    assert.equal(normalizeApiUrl('/custom/api'), '/custom/api');
    assert.equal(normalizeApiUrl('/backend'), '/backend/api');
  });

  test('handles trailing slashes correctly', () => {
    assert.equal(
      normalizeApiUrl('https://cohort-9-java-15749-muhammad-production.up.railway.app/'),
      'https://cohort-9-java-15749-muhammad-production.up.railway.app/api'
    );
    assert.equal(
      normalizeApiUrl('https://cohort-9-java-15749-muhammad-production.up.railway.app/api/'),
      'https://cohort-9-java-15749-muhammad-production.up.railway.app/api'
    );
  });

  test('does not duplicate /api when already present', () => {
    assert.equal(
      normalizeApiUrl('https://cohort-9-java-15749-muhammad-production.up.railway.app/api'),
      'https://cohort-9-java-15749-muhammad-production.up.railway.app/api'
    );
  });
});

describe('isLocalHostname', () => {
  test('identifies localhost and loopback IPv4/IPv6 addresses', () => {
    assert.equal(isLocalHostname('localhost'), true);
    assert.equal(isLocalHostname('sub.localhost'), true);
    assert.equal(isLocalHostname('127.0.0.1'), true);
    assert.equal(isLocalHostname('127.0.0.99'), true);
    assert.equal(isLocalHostname('[::1]'), true);
    assert.equal(isLocalHostname('::1'), true);
  });

  test('rejects non-local hostnames', () => {
    assert.equal(isLocalHostname('example.com'), false);
    assert.equal(isLocalHostname('192.168.1.1'), false);
    assert.equal(isLocalHostname('10.0.0.1'), false);
    assert.equal(isLocalHostname('localhost.evil.com'), false);
    assert.equal(isLocalHostname(''), false);
    assert.equal(isLocalHostname(null), false);
    assert.equal(isLocalHostname(undefined), false);
  });
});

describe('isLocalOrSecureUrl', () => {
  test('accepts HTTPS and same-origin relative URLs', () => {
    assert.equal(isLocalOrSecureUrl('https://example.com/api'), true);
    assert.equal(isLocalOrSecureUrl('/api/contacts'), true);
    assert.equal(isLocalOrSecureUrl('/auth/profile'), true);
  });

  test('accepts local HTTP origins', () => {
    assert.equal(isLocalOrSecureUrl('http://localhost:8080/api'), true);
    assert.equal(isLocalOrSecureUrl('http://127.0.0.1:8080/api'), true);
    assert.equal(isLocalOrSecureUrl('http://[::1]:8080/api'), true);
  });

  test('rejects insecure non-local HTTP origins and non-HTTP protocols', () => {
    assert.equal(isLocalOrSecureUrl('http://example.com/api'), false);
    assert.equal(isLocalOrSecureUrl('http://192.168.1.100:8080/api'), false);
    assert.equal(isLocalOrSecureUrl('//example.com/api'), false);
    assert.equal(isLocalOrSecureUrl('javascript:alert(1)'), false);
    assert.equal(isLocalOrSecureUrl(''), false);
    assert.equal(isLocalOrSecureUrl(null), false);
    assert.equal(isLocalOrSecureUrl(undefined), false);
  });
});

describe('CSRF Token Extraction (getCsrfToken)', () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    globalThis.document = { cookie: '' };
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  test('returns null when document is undefined', () => {
    delete globalThis.document;
    assert.equal(getCsrfToken(), null);
  });

  test('returns null when XSRF-TOKEN cookie is not present', () => {
    globalThis.document.cookie = 'other_cookie=123; session=abc';
    assert.equal(getCsrfToken(), null);
  });

  test('extracts and returns plain XSRF-TOKEN cookie value', () => {
    globalThis.document.cookie = 'XSRF-TOKEN=test-token-value-12345';
    assert.equal(getCsrfToken(), 'test-token-value-12345');
  });

  test('extracts and returns XSRF-TOKEN among multiple cookies', () => {
    globalThis.document.cookie = 'theme=dark; XSRF-TOKEN=my-csrf-token; session_id=xyz';
    assert.equal(getCsrfToken(), 'my-csrf-token');
  });

  test('decodes valid percent-encoded XSRF-TOKEN correctly', () => {
    globalThis.document.cookie = 'XSRF-TOKEN=hello%20world%21';
    assert.equal(getCsrfToken(), 'hello world!');
  });

  test('returns null safely without throwing when XSRF-TOKEN is malformed percent-encoded (URIError)', () => {
    // "%E0%A4%A" is an incomplete multi-byte UTF-8 sequence that triggers URIError in decodeURIComponent
    globalThis.document.cookie = 'XSRF-TOKEN=%E0%A4%A';
    assert.doesNotThrow(() => {
      const result = getCsrfToken();
      assert.equal(result, null);
    });
  });

  test('returns null safely when percent-encoding is truncated', () => {
    globalThis.document.cookie = 'XSRF-TOKEN=%';
    assert.doesNotThrow(() => {
      const result = getCsrfToken();
      assert.equal(result, null);
    });
  });
});

describe('Authenticated Request Security (request)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    safeStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    safeStorage.clear();
  });

  test('rejects insecure non-local HTTP URLs before dispatching request', async () => {
    safeStorage.setItem('cms_auth_token', 'sensitive-secret-token');
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({}) };
    };

    await assert.rejects(
      async () => {
        await request('/auth/phone', {
          method: 'PUT',
          baseUrl: 'http://insecure-remote.com/api',
          body: JSON.stringify({ phone: '+1234567890' })
        });
      },
      {
        name: 'Error',
        message: 'Insecure HTTP request to non-local origin rejected'
      }
    );

    assert.equal(fetchCalled, false, 'Fetch must not be called when destination is an insecure non-local HTTP URL');
  });

  test('permits local HTTP origins and attaches cms_auth_token', async () => {
    safeStorage.setItem('cms_auth_token', 'local-secret-token');
    let capturedHeaders = null;
    let capturedUrl = null;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { ok: true } })
      };
    };

    await request('/auth/phone', {
      method: 'PUT',
      baseUrl: 'http://localhost:8080/api',
      body: JSON.stringify({ phone: '+1234567890' })
    });

    assert.equal(capturedUrl, 'http://localhost:8080/api/auth/phone');
    assert.equal(capturedHeaders?.Authorization, 'Bearer local-secret-token');
  });

  test('permits HTTPS origins and attaches cms_auth_token', async () => {
    safeStorage.setItem('cms_auth_token', 'remote-secret-token');
    let capturedHeaders = null;
    let capturedUrl = null;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { ok: true } })
      };
    };

    await request('/auth/phone', {
      method: 'PUT',
      baseUrl: 'https://cohort-9-java-15749-muhammad-production.up.railway.app/api',
      body: JSON.stringify({ phone: '+1234567890' })
    });

    assert.equal(capturedUrl, 'https://cohort-9-java-15749-muhammad-production.up.railway.app/api/auth/phone');
    assert.equal(capturedHeaders?.Authorization, 'Bearer remote-secret-token');
  });
});
