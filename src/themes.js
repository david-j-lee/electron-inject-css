const elementThemes = require('./themes/element/config.json');

const configs = [elementThemes];

const getProducts = () => {
  return configs.map((config) => config.name);
};

const getThemes = (productName) => {
  const product = getProduct(productName);
  return !product ? null : product.themes.map((theme) => theme.name);
};

const getProduct = (product) => {
  if (!product) {
    return null;
  }
  return configs.find(
    (config) => config.name.toLowerCase() === product.trim().toLowerCase()
  );
};

const getTheme = (productName, theme) => {
  if (!productName || !theme) {
    return null;
  }
  const product = getProduct(productName);
  if (!product) {
    return null;
  }
  return product.themes.find(
    (t) => t.name.toLowerCase() === theme.trim().toLowerCase()
  );
};

module.exports = {
  getProducts,
  getThemes,
  getProduct,
  getTheme,
};
