export function paginate(items, page, limit) {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const data = items.slice(startIndex, startIndex + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
}
