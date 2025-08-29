import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRatingStats } from './ratingUtils.ts';

test('showRating é falso com menos de 10 avaliações', () => {
  const stats = calculateRatingStats([5, 4, 3, 5, 4]);
  assert.strictEqual(stats.showRating, false);
  assert.strictEqual(stats.totalRatings, 5);
});

test('showRating é verdadeiro com 10 ou mais avaliações', () => {
  const ratings = Array(10).fill(5);
  const stats = calculateRatingStats(ratings);
  assert.strictEqual(stats.showRating, true);
  assert.strictEqual(stats.totalRatings, 10);
});
