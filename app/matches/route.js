import { matches } from '../../server/api.js';

export const dynamic = 'force-dynamic';

export function GET() {
  return matches();
}
