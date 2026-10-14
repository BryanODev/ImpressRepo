export default async function handler(request) {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const issuer = (process.env.MCP_AUTH_ISSUER || '').replace(/\/+$/, '');
  if (!issuer) return Response.json({ error: 'OAuth not configured' }, { status: 503 });
  const resource = new URL('/mcp', request.url).href;
  return Response.json({
    resource,
    authorization_servers: [issuer],
    scopes_supported: ['jobs:create'],
    resource_documentation: 'https://developers.openai.com/plugins/build/auth'
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
export const config = { path: '/.well-known/oauth-protected-resource' };
