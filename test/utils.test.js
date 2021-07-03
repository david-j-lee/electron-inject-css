const { normalizePath } = require('../src/utils');

test('normalize path should replace \\ with /', () => {
  const normalizedPath = normalizePath('\\some\\path');
  expect(normalizedPath).toBe('/some/path');
});
