import { normalizePath } from '../src/utils';

describe('normalizePath', () => {
  test('normalize path should replace "\\" with "/"', () => {
    const normalizedPath = normalizePath('\\some\\path');
    expect(normalizedPath).toBe('/some/path');
  });
});
