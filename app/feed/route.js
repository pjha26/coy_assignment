import { feed } from '../../server/api.js';

export const dynamic = 'force-dynamic';

export function GET() {
  return feed();
}
