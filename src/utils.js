const normalizePath = (path) => {
  if (!path) {
    return path;
  }
  return path.replace(/\\/g, '/');
};

const getFileName = (path) => {
  const normalizedPath = normalizePath(path);
  const segments = normalizedPath.split('/');
  return segments[segments.length - 1];
};

const getDirectory = (path) => {
  const normalizedPath = normalizePath(path);
  const segments = normalizedPath.split('/');
  if (segments.length === 1) {
    return normalizedPath;
  }
  return segments.splice(0, segments.length - 1).join('/');
};

module.exports = {
  normalizePath,
  getFileName,
  getDirectory,
};
