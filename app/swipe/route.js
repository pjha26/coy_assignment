import { swipe } from '../../server/api.js';

export function POST(request) {
  return swipe(request);
}
