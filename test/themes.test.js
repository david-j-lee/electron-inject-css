const { expect } = require('chai');
const {
  getProduct,
  getProducts,
  getTheme,
  getThemes,
} = require('../src/themes');

describe('getProducts', () => {
  it('should return a listing product names', () => {
    const products = getProducts();
    expect(products.length).to.be.above(0);
  });
});

describe('getProduct', () => {
  it('should return a product for a valid product name', () => {
    const product = getProduct('element');
    expect(product).to.be.an('object');
  });
  it('should return a product for a valid product name regardless of casing', () => {
    const product = getProduct('eLEmeNT');
    expect(product).to.be.an('object');
  });
  it('should return null when given null', () => {
    const product = getProduct();
    expect(product).to.not.be.ok;
  });
  it('should return null for a valid product name', () => {
    const product = getProduct('i-should-never-exist-foo-bar!');
    expect(product).to.not.be.ok;
  });
});

describe('getThemes', () => {
  it('should return a listing of themes for a valid product name', () => {
    const themes = getThemes('element');
    expect(themes.length).to.be.above(0);
  });
  it('should return a listing of themes for a valid product name regardless of casing', () => {
    const themes = getThemes('EleMenT');
    expect(themes.length).to.be.above(0);
  });
  it('should return a null if given null', () => {
    const themes = getThemes();
    expect(themes).to.be.not.ok;
  });
  it('should return a null if given invalid product', () => {
    const themes = getThemes('i-should-never-exist-foo-bar!');
    expect(themes).to.be.not.ok;
  });
});

describe('getTheme', () => {
  it('should return a theme for valid product and theme name', () => {
    const theme = getTheme('element', 'compact');
    expect(theme).to.be.an('object');
  });
  it('should return a theme for valid product and theme name regardless of casing', () => {
    const theme = getTheme('ELemEnt', 'ComPACt');
    expect(theme).to.be.an('object');
  });
  it('should return null for an invalid product name', () => {
    const theme = getTheme('i-should-never-exist-foo-bar!', 'compact');
    expect(theme).to.not.be.ok;
  });
  it('should return null for an invalid theme name', () => {
    const theme = getTheme('element', 'i-should-never-exist-foo-bar!');
    expect(theme).to.not.be.ok;
  });
  it('should return null for an null product name', () => {
    const theme = getTheme(null, 'i-should-never-exist-foo-bar!');
    expect(theme).to.not.be.ok;
  });
  it('should return null for an null theme name', () => {
    const theme = getTheme('element');
    expect(theme).to.not.be.ok;
  });
  it('should return null for null', () => {
    const theme = getTheme();
    expect(theme).to.not.be.ok;
  });
});
