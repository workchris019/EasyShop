function shapeProduct(p) {
  const { ratingSum = 0, ratingCount = 0, __v, ...rest } = p;
  const salePrice = Number.isFinite(rest.salePrice) ? rest.salePrice : rest.price;
  return { ...rest, salePrice, discount: rest.discount || 0, rating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0, ratingCount };
}

module.exports = { shapeProduct };