import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getCsrfToken } from '../src/services/api.js';

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
