import {
  type Change,
  type DeleteFile,
  type RenameFile,
} from '@studiolabot/next-code-generation';

const changes: (Change | DeleteFile | RenameFile)[] = [
  {
    type: 'rename',
    path: 'src/app/sentinel-view-page.tsx',
    newPath: 'src/app/sentinel-page.tsx',
  },
];
export default changes;
