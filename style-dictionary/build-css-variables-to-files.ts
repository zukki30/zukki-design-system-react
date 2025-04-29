import { buildTokens } from './utils';

const FILE_NAMES = ['light', 'dark'] as const;

FILE_NAMES.forEach((fileName) => {
  buildTokens(fileName).catch(console.error);
});
