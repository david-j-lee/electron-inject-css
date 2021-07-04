const { expect } = require('chai');
const { getDirectory, getFileName, normalizePath } = require('../src/utils');

describe('normalizePath', () => {
  it('should replace "\\" with "/"', () => {
    const normalizedPath = normalizePath('\\some\\path');
    expect(normalizedPath).to.equal('/some/path');
  });
});

describe('getFileName', () => {
  it('should return file name from path', () => {
    const fileName = getFileName('\\some\\path\\the-file');
    expect(fileName).to.equal('the-file');
  });

  it('should return file name regardless of separator', () => {
    const fileName = getFileName('\\some/path/testing\\the-file');
    expect(fileName).to.equal('the-file');
  });

  it('should return the file name if no separators are present', () => {
    const fileName = getFileName('the-file');
    expect(fileName).to.equal('the-file');
  });
});

describe('getDirectory', () => {
  it('should return directory from path', () => {
    const directory = getDirectory('\\some\\path\\the-file');
    expect(directory).to.equal('/some/path');
  });

  it('should return directory regardless of separator', () => {
    const directory = getDirectory('\\some/path/testing\\the-file');
    expect(directory).to.equal('/some/path/testing');
  });

  it('should return directory if no separators are present', () => {
    const directory = getDirectory('the-directory');
    expect(directory).to.equal('the-directory');
  });
});
