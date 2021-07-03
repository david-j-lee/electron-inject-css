import elementThemes from './themes/element/config.json';

const configs = [elementThemes];

export const getProducts = () => {
  return configs.map((c) => c.name);
};

export const getThemes = (product) => {
  const p = getProduct(product);
  return !p ? null : p.themes.map((theme) => theme.name);
};

export const getProduct = (product) => {
  if (!product) {
    return null;
  }
  return configs.find((c) => c.name.toLowerCase() === product.toLowerCase());
};

export const getTheme = (product, theme) => {
  if (!product) {
    return null;
  }
  const p = getProduct(product);
  if (!p) {
    return null;
  }
  return p.themes.find((t) => t.name.toLowerCase() === theme.toLowerCase());
};
