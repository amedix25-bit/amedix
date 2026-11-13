import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// TEMPORARY probe 6 — is the platform's asset API reachable from the app, and
// does it see the uploaded document objects?

export default async function (req) {
  createClientFromRequest(req);
  const appId = '6a9ea24b809f9bb40f0d02bf';
  const auth = req.headers.get('authorization') || '';
  const serviceAuth = req.headers.get('base44-service-authorization') || '';

  const tests: Array<{ label: string; url: string; method: string; body?: unknown; service?: boolean }> = [
    { label: 'GET app', url: `/api/apps/${appId}`, method: 'GET' },
    { label: 'GET app (service)', url: `/api/apps/${appId}`, method: 'GET', service: true },
    { label: 'GET assets', url: `/api/apps/${appId}/assets`, method: 'GET' },
    { label: 'GET assets (service)', url: `/api/apps/${appId}/assets`, method: 'GET', service: true },
    { label: 'GET entity-schemas', url: `/api/apps/${appId}/entity-schemas`, method: 'GET' },
  ];

  const results: unknown[] = [];
  for (const t of tests) {
    try {
      const headers: Record<string, string> = { 'Base44-App-Id': appId };
      if (t.service) {
        if (serviceAuth) headers['Base44-Service-Authorization'] = serviceAuth;
        if (auth) headers.Authorization = auth;
      } else if (auth) {
        headers.Authorization = auth;
      }
      const init: RequestInit = { method: t.method, headers, signal: AbortSignal.timeout(8000) };
      if (t.body) {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(t.body);
      }
      const res = await fetch(`https://base44.app${t.url}`, init);
      let text = '';
      try { text = (await res.text()).slice(0, 400); } catch (e) { /* ignore */ }
      results.push({ label: t.label, status: res.status, text });
    } catch (e) {
      results.push({ label: t.label, error: String((e as Error)?.message).slice(0, 140) });
    }
  }
  return Response.json({ hasAuth: !!auth, hasService: !!serviceAuth, results });
}