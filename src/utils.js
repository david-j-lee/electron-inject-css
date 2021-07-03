export const normalizePath = (path) => {
  if (!path) {
    return path;
  }
  return path.replace(/\\/g, '/');
};

export const getFileName = (path) => {
  const normalizedPath = normalizePath(path);
  const segments = normalizedPath.split('/');
  return segments[segments.length - 1];
};

export const getDirectory = (path) => {
  const normalizedPath = normalizePath(path);
  const segments = normalizedPath.split('/');
  return segments.splice(0, segments.length - 1).join('/');
};
