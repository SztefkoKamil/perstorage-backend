const sinon = require('sinon');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const process = require('process');

const User = require('../../model/user');
const File = require('../../model/file');

const auth = require('../../controller/auth');

const req = {
  body: {
    email: 'test@test.com',
    password: 'password1',
  },
};

describe('/controller/auth.js - login', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw Error with statusCode: 401 if email not found', async () => {
    sinon.stub(User, 'findOne').returns(false);

    const result = await auth.login(req, {}, () => {});

    expect(result).toEqual(expect.any(Error));
    expect(result).toHaveProperty('statusCode', 401);
  });

  it('should throw Error with statusCode: 401 if password is wrong', async () => {
    sinon.stub(User, 'findOne').returns({ password: 'user-password' });
    sinon.stub(bcrypt, 'compare').returns(false);

    const result = await auth.login(req, {}, () => {});

    expect(result).toEqual(expect.any(Error));
    expect(result).toHaveProperty('statusCode', 401);
  });

  it('should call jwt.sign() with proper arguments', async () => {
    sinon
      .stub(User, 'findOne')
      .returns({ _id: 'user-id', password: 'user-password', email: 'test@test.com' });
    sinon.stub(bcrypt, 'compare').returns('password-ok');
    sinon.replace(
      jwt,
      'sign',
      jest.fn((arg1, arg2) => {})
    );
    sinon.replace(process, 'env', { JWT_LOGIN_SECRET: 'jwt-login-secret' });
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(() => {}),
    };

    await auth.login(req, res, () => {});

    expect(jwt.sign).toHaveBeenCalledWith(
      { email: 'test@test.com', userId: 'user-id' },
      'jwt-login-secret'
    );
  });

  it('should call res.status().json() with proper arguments', async () => {
    sinon
      .stub(User, 'findOne')
      .returns({ _id: 'user-id', password: 'user-password', email: 'test@test.com' });
    sinon.stub(bcrypt, 'compare').returns('password-ok');
    sinon.stub(jwt, 'sign').returns('token-ok');
    const res = {
      status: jest.fn(arg => res),
      json: jest.fn(arg => {}),
    };

    await auth.login(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.any(String),
        userId: expect.any(String),
      })
    );
  });

  it('should call next() with error with error.statusCode: 500 if undefined error occurs', async () => {
    sinon
      .stub(User, 'findOne')
      .returns({ _id: 'user-id', password: 'user-password', email: 'test@test.com' });
    sinon.stub(bcrypt, 'compare').returns('password-ok');
    sinon.stub(jwt, 'sign').throws('undefined-error');
    const nextFake = jest.fn(err => {});

    await auth.login(req, {}, nextFake);

    expect(nextFake).toHaveBeenCalledWith(expect.any(Error));
    expect(nextFake).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
      })
    );
  });
});
