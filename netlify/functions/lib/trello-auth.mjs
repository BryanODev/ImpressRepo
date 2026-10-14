import { createVerify } from 'node:crypto';

const TRELO_JWT_KEYS_URL = 'https://api.trello.com/1/resource/jwt-public-keys';
let publicKeys = [];
let keysExpireAt = 0;

async function loadPublicKeys(force = false) {
  if (!force && Date.now() < keysExpireAt && publicKeys.length) return publicKeys;
  const response = await fetch(TRELO_JWT_KEYS_URL);
  if (!response.ok) throw new Error('Unable to retrieve Trello signing keys');
  const json = await response.json();
  if (!Array.isArray(json.keys) || json.keys.length === 0) throw new Error('Invalid Trello signing keys');
  publicKeys = json.keys;
  keysExpireAt = Date.now() + 60 * 60 * 1000;
  return publicKeys;
}

function unpackJwt(token) {
  const segments = token.split('.');
  if (segments.length !== 3 || token.length > 12000) throw new Error('Invalid Trello JWT');
  const header = JSON.parse(Buffer.from(segments[0], 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
  if (header.alg !== 'RS256') throw new Error('Unexpected Trello JWT algorithm');
  return { segments, payload };
}

export async function authorizePowerUp(request) {
  const powerUpId = process.env.TRELLO_POWERUP_ID;
  if (!powerUpId) throw new Error('Missing TRELLO_POWERUP_ID');
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!match) return null;
  let parsed;
  try {
    parsed = unpackJwt(match[1]);
  } catch {
    return null;
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parsed.segments;
  const sig = Buffer.from(encodedSignature, 'base64url');
  const signed = encodedHeader + '.' + encodedPayload;
  let verified = false;
  for (const refresh of [false, true]) {
    const keys = await loadPublicKeys(refresh);
    verified = keys.some((key) => {
      try {
        return createVerify('RSA-SHA256').update(signed).end().verify(key, sig);
      } catch { return false; }
    });
    if (verified) break;
  }
  if (!verified) return null;
  const p = parsed.payload;
  const now = Math.floor(Date.now() / 1000);
  if (p.iss !== 'trello' || p.idPlugin !== powerUpId ||
      typeof p.idMember !== 'string' || typeof p.idBoard !== 'string' ||
      typeof p.exp !== 'number' || p.exp <= now ||
      typeof p.iat !== 'number' || p.iat > now + 60) return null;
  return p;
}

export async function trello(path, method = 'GET', body = null) {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_API_TOKEN;
  if (!key || !token) throw new Error('Missing Trello credentials');
  const response = await fetch('https://api.trello.com/1' + path, {
    method,
    headers: {
      Authorization: `OAuth oauth_consumer_key="${key}", oauth_token="${token}"`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) {
    const error = new Error(`Trello returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function json(data, status = 200) {
  if (status === 204) return new Response(null, { status, headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }});
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}
