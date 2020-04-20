const isAuth = require('../../utils/isAuth');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const req = {};

describe('/utils/isAuth.js - binded to call', () => {
  const toCall = isAuth.bind(this, req, {}, () => {});

  it('should throw error if no Authorization header is present', () => {
    req.get = () => null;

    expect(toCall).toThrow('Authorization filed - no token');
  });

  it('should throw error if Authorization header value cannot be splited', () => {
    req.get = () => 'bad-Authorization-value';
    expect(toCall).toThrow();
  });

  it('should throw error if token cannot be verified', () => {
    req.get = () => 'Bearer bad-token';

    expect(toCall).toThrow();
  });
});

describe('/utils/isAuth.js - with stubbed jwt', () => {
  it('should get Authorization header from request', () => {
    req.get = jest.fn((header) => header);
    sinon.stub(jwt, 'verify');
    jwt.verify.returns({ userId: 'good-id' });

    isAuth(req, {}, () => {});

    expect(req.get).toHaveBeenCalledWith('Authorization');
  });

  it('should call jwt.verify() method', () => {
    req.get = () => 'Bearer good-token';

    isAuth(req, {}, () => {});

    expect(jwt.verify.called).toBe(true);
  });

  it('should yield req.userId after decoding token', () => {
    isAuth(req, {}, () => {});

    expect(req).toHaveProperty('userId', 'good-id');
    jwt.verify.restore();
  });
});
