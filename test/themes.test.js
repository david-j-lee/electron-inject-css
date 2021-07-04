const { expect } = require('chai');
const { getProducts } = require('../src/themes');

describe('getProducts', () => {
  it('should return a listing product names', () => {
    const products = getProducts();
    expect(products.length).to.be.above(0);
  });
});
