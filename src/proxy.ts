import { type NextRequest, NextResponse } from 'next/server';

/**
 * Sito: a password in front of the whole Umami app (stats.hallosito.de), on top of Umami's own login.
 * A small form sets a cookie for 90 days; Basic auth won't do, because the dashboard sends its own
 * `Authorization: Bearer` header. Left open: the tracker script and the hit endpoint, which the Sito
 * app fetches server-side (src/analytics/umami-proxy.ts there), and the heartbeat. Unset
 * STATS_PASSWORD turns the gate off; changing it signs everyone out.
 */
const OPEN_PATHS = ['/script.js', '/api/send', '/api/heartbeat'];
const LOGIN_PATH = '/sito-login';
const COOKIE = 'sito_stats';
const MAX_AGE = 60 * 60 * 24 * 90;

async function cookieValue(password: string) {
  const bytes = new TextEncoder().encode(`sito-stats:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

function sameText(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function safeNext(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

function loginPage(next: string, failed: boolean) {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Sito Statistik</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a1233;color:#fff;font:16px system-ui,sans-serif}
form{width:min(320px,calc(100% - 32px));display:grid;gap:12px}h1{font-size:22px;margin:0 0 8px}
input,button{font:inherit;padding:12px;border-radius:8px;border:0}button{background:#ffd23f;color:#0a1233;font-weight:600;cursor:pointer}
p{margin:0;color:#ffd23f}</style></head><body>
<form method="post" action="${LOGIN_PATH}"><h1>Sito Statistik</h1>
${failed ? '<p>Das Passwort stimmt nicht.</p>' : ''}
<input type="password" name="password" placeholder="Passwort" autocomplete="current-password" autofocus required>
<input type="hidden" name="next" value="${escapeHtml(next)}"><button>Weiter</button></form></body></html>`;
  return new NextResponse(html, {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function proxy(request: NextRequest) {
  const password = process.env.STATS_PASSWORD;
  const { pathname, search } = request.nextUrl;
  if (!password || OPEN_PATHS.includes(pathname)) return NextResponse.next();

  const expected = await cookieValue(password);

  if (pathname === LOGIN_PATH && request.method === 'POST') {
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    const given = form.get('password');
    if (typeof given !== 'string' || !sameText(await cookieValue(given), expected)) {
      return loginPage(next, true);
    }
    const response = NextResponse.redirect(new URL(next, request.url), 303);
    response.cookies.set(COOKIE, expected, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    });
    return response;
  }

  if (sameText(request.cookies.get(COOKIE)?.value ?? '', expected)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 401 });
  }
  return loginPage(pathname === LOGIN_PATH ? '/' : pathname + search, false);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
