import { pointsForAttempt } from './scoring';

describe('pointsForAttempt', () => {
  it('awards full points on the first attempt', () => {
    expect(pointsForAttempt(10, 0)).toBe(10);
    expect(pointsForAttempt(5, 0)).toBe(5);
  });

  it('awards 40% on the second attempt', () => {
    expect(pointsForAttempt(10, 1)).toBe(4);
  });

  it('awards 20% on the third attempt', () => {
    expect(pointsForAttempt(10, 2)).toBe(2);
  });

  it('awards no points after three failed attempts', () => {
    expect(pointsForAttempt(10, 3)).toBe(0);
    expect(pointsForAttempt(10, 99)).toBe(0);
  });

  it('scales with the base point value', () => {
    expect(pointsForAttempt(25, 1)).toBe(10);
    expect(pointsForAttempt(25, 2)).toBe(5);
  });

  it('returns 0 for attempt counts outside 0–2', () => {
    expect(pointsForAttempt(10, -1)).toBe(0);
  });
});
