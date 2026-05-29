/**
 * Unit tests for the cookies helper (shared/lib/storage/cookies.ts).
 *
 * document.cookie is cleared before and after every test so the cases
 * do not leak state into each other.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  deleteCookie,
  getCookie,
  getCookieConsent,
  setCookie,
  setCookieConsent,
} from '../../frontend/src/shared/lib/storage/cookies';

function clearAllCookies(): void {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  }
}

describe('setCookie / getCookie', () => {
  beforeEach(clearAllCookies);
  afterEach(clearAllCookies);

  it('stores a value that getCookie then returns', () => {
    setCookie('test_key', 'hello');
    expect(getCookie('test_key')).toBe('hello');
  });

  it('returns null for a missing cookie', () => {
    expect(getCookie('missing')).toBeNull();
  });

  it('keeps multiple cookies independent', () => {
    setCookie('a', '1');
    setCookie('b', '2');
    expect(getCookie('a')).toBe('1');
    expect(getCookie('b')).toBe('2');
  });
});

describe('deleteCookie', () => {
  beforeEach(clearAllCookies);
  afterEach(clearAllCookies);

  it('makes the value unreachable after removal', () => {
    setCookie('to_remove', 'x');
    expect(getCookie('to_remove')).toBe('x');

    deleteCookie('to_remove');
    expect(getCookie('to_remove')).toBeNull();
  });
});

describe('cookie consent', () => {
  beforeEach(clearAllCookies);
  afterEach(clearAllCookies);

  it('returns false by default (no consent given)', () => {
    expect(getCookieConsent()).toBe(false);
  });

  it('records consent after setCookieConsent(true)', () => {
    setCookieConsent(true);
    expect(getCookieConsent()).toBe(true);
  });

  it('does not record anything when setCookieConsent(false) is called', () => {
    setCookieConsent(false);
    expect(getCookieConsent()).toBe(false);
  });
});
