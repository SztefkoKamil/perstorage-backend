const sinon = require('sinon');
const fs = require('fs');
const fsExtra = require('fs-extra');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const process = require('process');

const User = require('../../model/user');
const File = require('../../model/file');

const auth = require('../../controller/auth');

describe('/controller/auth.js - signup', () => {
  const req = {
    body: {
      email: 'test@test.pl',
      name: 'Tester',
      password: 'password1',
    },
  };

  afterEach(() => {
    sinon.restore();
  });

  it('should thrown error with statusCode: 422 if in database is 10 or more users', async () => {
    sinon.stub(User, 'find').returns({ countDocuments: () => 10 });

    const result = await auth.signup(req, {}, () => {});

    expect(result).toEqual(expect.any(Error));
    expect(result).toHaveProperty('statusCode', 422);
    expect(result).toHaveProperty(
      'message',
      'Sorry, too much users. Please contact me: sztefkokamil@gmail.com'
    );
  });

  it('should thrown error with statusCode: 409 if user with email exist in database', async () => {
    sinon.stub(User, 'find').returns({ countDocuments: () => 8 });
    sinon.stub(User, 'findOne').returns(true);

    const result = await auth.signup(req, {}, () => {});

    expect(result).toEqual(expect.any(Error));
    expect(result).toHaveProperty('statusCode', 409);
    expect(result).toHaveProperty('message', 'User with this email exist');
  });

  it('should call bcrypt.hash() with proper arguments', async () => {
    const hashFake = jest.fn((arg1, arg2) => 'hashed-password');
    const res = {
      status: () => res,
      json: () => {},
    };
    sinon.stub(User, 'find').returns({ countDocuments: () => 8 });
    sinon.stub(User, 'findOne').returns(false);
    sinon
      .stub(User.prototype, 'save')
      .returns({ email: req.email, name: req.name, _id: 'user-id' });
    sinon.replace(bcrypt, 'hash', hashFake);
    sinon.stub(fs, 'mkdirSync');

    await auth.signup(req, res, () => {});

    expect(hashFake).toHaveBeenCalledWith(req.body.password, 12);
  });

  it('should save new User', async () => {
    const res = {
      status: () => res,
      json: () => {},
    };
    const saveReturn = {
      _id: 'user-id',
      email: req.body.email,
      name: req.body.name,
    };
    const saveFake = jest.fn(() => saveReturn);
    sinon.stub(User, 'find').returns({ countDocuments: () => 8 });
    sinon.stub(User, 'findOne').returns(false);
    sinon.replace(User.prototype, 'save', saveFake);
    sinon.stub(bcrypt, 'hash').returns('hashed-password');
    sinon.stub(fs, 'mkdirSync');

    await auth.signup(req, res, () => {});

    expect(saveFake).toHaveBeenCalled();
  });

  it('should call fs.mkdirSync() with proper argument', async () => {
    const res = {
      status: () => res,
      json: () => {},
    };
    const mkdirSyncFake = jest.fn(arg => {});
    sinon.stub(User, 'find').returns({ countDocuments: () => 8 });
    sinon.stub(User, 'findOne').returns(false);
    sinon
      .stub(User.prototype, 'save')
      .returns({ email: req.body.email, name: req.body.name, _id: 'user-id' });
    sinon.stub(bcrypt, 'hash').returns('hashed-password');
    sinon.replace(fs, 'mkdirSync', mkdirSyncFake);

    await auth.signup(req, res, () => {});

    expect(mkdirSyncFake).toHaveBeenCalledWith('storage/user-user-id');
  });

  it('should call res.state().jason() with proper arguments if no errors occur', async () => {
    const res = {
      status: jest.fn(arg => res),
      json: jest.fn(arg => {}),
    };
    sinon.stub(User, 'find').returns({ countDocuments: () => 8 });
    sinon.stub(User, 'findOne').returns(false);
    sinon
      .stub(User.prototype, 'save')
      .returns({ email: req.body.email, name: req.body.name, _id: 'user-id' });
    sinon.stub(bcrypt, 'hash').returns('hashed-password');
    sinon.stub(fs, 'mkdirSync');

    await auth.signup(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        email: req.body.email,
        name: req.body.name,
        id: 'user-id',
      })
    );
  });

  it('should call next() with error with error.statusCode: 500 if undefined error occurs', async () => {
    const nextFake = jest.fn(err => {});
    sinon.stub(User, 'find').returns({ countDocuments: () => 8 });
    sinon.stub(User, 'findOne').returns(false);
    sinon
      .stub(User.prototype, 'save')
      .returns({ email: req.body.email, name: req.body.name, _id: 'user-id' });
    sinon.stub(bcrypt, 'hash').returns('hashed-password');
    sinon.stub(fs, 'mkdirSync').throws('undefined-error');

    await auth.signup(req, {}, nextFake);

    expect(nextFake).toHaveBeenCalledWith(expect.any(Error));
    expect(nextFake).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
      })
    );
  });
});

describe('/controller/auth.js - login', () => {
  const req = {
    body: {
      email: 'test@test.com',
      password: 'password1',
    },
  };

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
