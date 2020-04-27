const errorHandler = require('../../utils/errorHandler');

it('should call res.status.json with proper arguments', () => {
  const error = { message: 'error-message' };
  const res = { status: jest.fn(arg => res), json: jest.fn(arg => {}) };

  errorHandler(error, {}, res, () => {});

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ message: error.message });
});
