import { buildTokens } from './utils';

const FILE_NAMES = ['light', 'dark'] as const;

for (const fileName of FILE_NAMES) {
  buildTokens(fileName).catch(console.error);
}
