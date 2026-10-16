// Turns a product document into what the pages need (adds the average rating, hides internals).
function shapeProduct(p) {
  const { ratingSum = 0, ratingCount = 0, __v, ...rest } = p;
  return { ...rest, rating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0, ratingCount };
}

module.exports = { shapeProduct };
