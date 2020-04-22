const isAuth = require('../../utils/isAuth');
const jwt = require('jsonwebtoken');
const process = require('process');
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
  afterEach(() => {
    sinon.restore();
  });

  it('should get Authorization header from request', () => {
    req.get = jest.fn(arg => 'Bearer token');
    sinon.stub(jwt, 'verify').returns({ userId: 'good-id' });

    isAuth(req, {}, () => {});

    expect(req.get).toHaveBeenCalledWith('Authorization');
  });

  it('should call jwt.verify() method with proper arguments', () => {
    req.get = () => 'Bearer token';
    sinon.replace(
      jwt,
      'verify',
      jest.fn((arg1, arg2) => {
        return { userId: 'good-id' };
      })
    );
    sinon.replace(process, 'env', { JWT_LOGIN_SECRET: 'jwt-login-secret' });

    isAuth(req, {}, () => {});

    expect(jwt.verify).toHaveBeenCalledWith('token', 'jwt-login-secret');
  });

  it('should req have userId property after decoding token', () => {
    req.get = () => 'Bearer token';
    sinon.stub(jwt, 'verify').returns({ userId: 'good-id' });

    isAuth(req, {}, () => {});

    expect(req).toHaveProperty('userId', 'good-id');
  });

  it('should call next() if Authorization success', () => {
    req.get = () => 'Bearer token';
    sinon.stub(jwt, 'verify').returns({ userId: 'good-id' });
    const nextFake = jest.fn(() => {});

    isAuth(req, {}, nextFake);

    expect(nextFake).toHaveBeenCalled();
  });
});
