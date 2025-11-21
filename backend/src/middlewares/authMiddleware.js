import jwt from 'jsonwebtoken';

export const authMiddleware = async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.code(401).send({ message: 'Authorization header is missing' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return reply.code(401).send({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = { id: decoded.id };
  } catch (err) {
    return reply.code(401).send({ message: 'Invalid token' });
  }
};
