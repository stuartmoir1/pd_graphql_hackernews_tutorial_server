async function feed(parent, args, context) {
  const filter = args.filter;
  const where = filter
    ? { OR: [{ description_contains: filter }, { url_contains: filter} ]}
    : {};

  const links = await context.prisma.links({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy
  });

  const count = await context.prisma
    .linksConnection({ where })
    .aggregate()
    .count();

  return { links, count };
}

module.exports = {
  feed
};
