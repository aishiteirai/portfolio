import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { projects } from '@/lib/projects';
import { readmeTag } from '@/lib/readme';

/** Repos whose README is shown on the site, as `owner/name` in lowercase. */
const watched = new Set(
  projects.filter((p) => p.readme === 'github' && p.repo).map((p) => new URL(p.repo!).pathname.slice(1).replace(/\/$/, '').toLowerCase()),
);

function validSignature(body: string, header: string | null, secret: string) {
  if (!header?.startsWith('sha256=')) return false;
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`);
  const got = Buffer.from(header);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/**
 * GitHub push webhook: when a watched repo gets a push, its cached README is dropped,
 * so the next visit fetches the new one. Configure it with the same secret as GITHUB_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook secret is not configured', { status: 500 });

  const body = await request.text();
  if (!validSignature(body, request.headers.get('x-hub-signature-256'), secret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (event === 'ping') return Response.json({ ok: true });
  if (event !== 'push') return Response.json({ ignored: event });

  const payload = JSON.parse(body) as { repository?: { full_name?: string } };
  const repo = payload.repository?.full_name?.toLowerCase();
  if (!repo || !watched.has(repo)) return Response.json({ ignored: repo ?? null });

  revalidateTag(readmeTag(repo), { expire: 0 });
  return Response.json({ revalidated: repo });
}
