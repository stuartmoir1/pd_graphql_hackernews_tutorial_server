const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { APP_SECRET, getUserId } = require('../utils');

async function signup(parent, args, context) {
  const hashedPassword = await bcrypt.hash(args.password, 10);
  const { password, ...user } = await context.prisma.createUser({ ...args, password: hashedPassword });
  const token = jwt.sign({ userId: user.id }, APP_SECRET);
  return { token, user };
}

async function login(parent, args, context) {
  const { password, ...user } = await context.prisma.user({ email: args.email });
  if (!user) throw new Error('No such user found');
  
  const valid = await bcrypt.compare(args.password, password);
  if (!valid) throw new Error('Invalid password');

  const token = jwt.sign({ userId: user.id }, APP_SECRET);
  return { token, user };
}

function post(parent, args, context) {
  const userId = getUserId(context);
  return context.prisma.createLink({
    url: args.url,
    description: args.description,
    postedBy: { connect: { id: userId }}
  });
}

async function vote(parent, args, context) {
  const userId = getUserId(context);
  const linkId = args.linkId;

  const voteExists = await context.prisma.$exists.vote({
    user: { id: userId },
    link: { id: linkId }
  });
  if (voteExists) throw new Error(`User already voted for link: ${linkId}`);

  return context.prisma.createVote({
    user: { connect: { id: userId } },
    link: { connect: { id: linkId } }
  });
}

module.exports = {
  signup,
  login,
  post,
  vote
}
