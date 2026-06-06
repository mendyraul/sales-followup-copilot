import { describe, it, expect } from 'vitest';
import { canTransition } from '../domain/lead';

describe('lead status transitions', () => {
  it('allows new -> contacted', () => {
    expect(canTransition('new', 'contacted')).toBe(true);
  });

  it('blocks won -> new', () => {
    expect(canTransition('won', 'new')).toBe(false);
  });
});
