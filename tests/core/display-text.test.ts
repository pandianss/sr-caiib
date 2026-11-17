import test from 'node:test';
import assert from 'node:assert/strict';
import { previewText } from '../../src/core/display-text.ts';

test('previews remove supported formatting before text is truncated', () => {
  assert.equal(previewText('**Synthetic reserve** moved from **16.5 to 18.1%**.\n Check *units* and `precision`.'), 'Synthetic reserve moved from 16.5 to 18.1%. Check units and precision.');
  assert.equal(previewText('**A sentence long enough to exceed the preview boundary**').slice(0, 12), 'A sentence l');
});

test('financial symbols and literal arithmetic survive presentation cleanup', () => {
  const text = '₹1,25,000 × 0.075 = ₹9,375; -2.5%; 2 * 3; a*b*c; 10**2; x_y; ≤ 1:2.';
  assert.equal(previewText(text), text);
  assert.equal(previewText('**₹500** at **5%**'), '₹500 at 5%');
});
