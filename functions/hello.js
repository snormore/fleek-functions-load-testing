export const main = (request) => {
  if (request.query) {
    return JSON.stringify(request.query);
  }
  return "Hello";
};
