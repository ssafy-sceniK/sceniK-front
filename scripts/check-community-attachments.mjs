import assert from 'node:assert/strict';

import {
  buildEditableAttachments,
  displayableImageAttachments,
  fallbackFileAttachments,
  moveArrayItem,
} from '../src/utils/communityAttachments.js';

const attachments = [
  {
    id: 'image-1',
    imageUrl: '/api/uploads/community/1618468869588532.jpg',
    type: 'image',
    name: '1618468869588532.jpg',
  },
  {
    id: 'file-1',
    url: '/api/uploads/community/guide.pdf',
    type: 'application/pdf',
    name: 'guide.pdf',
  },
];

assert.deepEqual(
  displayableImageAttachments(attachments).map((attachment) => attachment.id),
  ['image-1'],
  'image attachments should be rendered as previews, not file rows',
);

assert.deepEqual(
  fallbackFileAttachments(attachments).map((attachment) => attachment.id),
  ['file-1'],
  'non-image attachments should remain visible as fallback file rows',
);

const editable = buildEditableAttachments(attachments);
assert.equal(editable.length, 2);
assert.notStrictEqual(editable[0], attachments[0], 'edit state must not mutate original API attachment objects');
assert.ok(editable[0].editKey, 'editable attachments need stable local keys');

assert.deepEqual(
  moveArrayItem(['first', 'second', 'third'], 2, -1),
  ['first', 'third', 'second'],
  'existing attachments should be reorderable',
);

assert.deepEqual(
  moveArrayItem(['first', 'second'], 0, -1),
  ['first', 'second'],
  'out-of-range moves should keep the original order',
);

console.log('community attachment checks passed');
