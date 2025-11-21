export const errorHandler = (error, request, reply) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  request.log.error(error);

  reply.code(statusCode).send({
    statusCode,
    error: error.name || 'Error',
    message,
  });
};
