import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import createJob from './create-job.mjs';

const json = (body, status, headers = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

function settings(request) {
  const issuer = (process.env.MCP_AUTH_ISSUER || '').replace(/\/+$/, '');
  const audience = process.env.MCP_AUTH_AUDIENCE || new URL('/mcp', request.url).href;
  const allowed = (process.env.MCP_ALLOWED_SUBJECTS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  return { issuer, audience, allowed };
}

async function authenticate(request) {
  const { issuer, audience, allowed } = settings(request);
  if (!issuer || !allowed.length || !process.env.ACTION_SECRET) {
    return { error: 'MCP authentication not configured', status: 503 };
  }
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!match) return { error: 'Authentication required', status: 401 };
  try {
    const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    const { payload } = await jwtVerify(match[1], jwks, {
      issuer: `${issuer}/`, audience, algorithms: ['RS256']
    });
    const scopes = new Set(String(payload.scope || '').split(/\s+/));
    if (!allowed.includes(String(payload.sub)) || !scopes.has('jobs:create')) {
      return { error: 'Insufficient permissions', status: 403 };
    }
    return { subject: String(payload.sub) };
  } catch (error) {
    console.warn('mcp: token validation failed', error?.code || error?.name);
    return { error: 'Invalid or expired token', status: 401 };
  }
}

function makeServer(subject) {
  const server = new McpServer(
    { name: 'impress-jobs', version: '1.0.0' },
    {
      instructions: 'Create jobs in Trello with the Impress jobs-table product catalog. Confirm the requested board and list before creating a job. Never invent product choices or prices. A successful creation returns the Trello card URL.'
    }
  );

  server.registerTool('create_job', {
    title: 'Create Trello job with Items',
    description: 'Create a Trello job card in the named board and list, optionally with Items table products. Use only when the user explicitly requests creating a job. Ask for missing board or list names. Confirm details first. Product IDs and option keys must match the jobs-table/products.json catalog.',
    inputSchema: {
      business: z.string().trim().min(1).max(300).describe('Customer/business name or job card title'),
      board: z.string().trim().min(1).describe('Trello board name'),
      list: z.string().trim().min(1).describe('Trello list name in the board'),
      description: z.string().max(12000).optional().describe('Card description'),
      items: z.array(z.object({
        productId: z.string().min(1).describe('Catalog product ID, e.g. banner_lona'),
        quantity: z.number().int().min(1),
        options: z.record(z.string(), z.unknown()).optional(),
        cost: z.number().nonnegative().optional(),
        fileName: z.string().optional(),
        finished: z.boolean().optional(),
      })).max(100).optional().describe('Products and options for the existing Items table')
    },
    securitySchemes: [{ type: 'oauth2', scopes: ['jobs:create'] }],
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
  }, async (params) => {
    // Reuse the already-tested Netlify handler; its ACTION_SECRET stays on the server.
    // The OAuth token is checked above, before any MCP operation can reach this handler.
    const internalRequest = new Request('https://internal.invalid/create-job', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.ACTION_SECRET}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ ...params, items: params.items || [] })
    });
    const result = await createJob(internalRequest);
    const data = await result.json();
    console.info('mcp:create_job', { user: subject, status: result.status, cardId: data.cardId || null });
    return {
      isError: !result.ok || data.success !== true,
      structuredContent: data,
      content: [{ type: 'text', text: JSON.stringify(data) }]
    };
  });
  return server;
}

export default async function handler(request) {
  const auth = await authenticate(request);
  if (auth.error) {
    const metadata = new URL('/.well-known/oauth-protected-resource', request.url).href;
    return json({ error: auth.error }, auth.status, auth.status === 401 ? {
      'WWW-Authenticate': `Bearer resource_metadata="${metadata}", scope="jobs:create"`
    } : {});
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }
  const server = makeServer(auth.subject);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  await server.connect(transport);
  try { return await transport.handleRequest(request); }
  finally { await transport.close(); await server.close(); }
}

export const config = {
  path: '/mcp',
  rateLimit: { windowSize: 60, windowLimit: 60, aggregateBy: ['ip', 'domain'] }
};
