const path = require('path');
const fs = require('fs');
const process = require('process');
const File = require('../../model/file');
const User = require('../../model/user');

const sinon = require('sinon');

const storage = require('../../controller/storage');

describe('/controller/storage.js - getFiles', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should call File.find() with proper argument', async () => {
    const req = { userId: 'user-id' };
    const res = { status: () => res, json: () => {} };
    const findStub = sinon.stub(File, 'find').returns([]);

    await storage.getFiles(req, res, () => {});

    sinon.assert.calledWith(findStub, { owner: req.userId });
  });

  it('should call res.status().json() with proper arguments if no error occurs', async () => {
    const req = { userId: 'user-id' };
    const res = { status: jest.fn(arg => res), json: jest.fn(arg => {}) };
    const findResult = [
      {
        _id: 'file-id-1',
        type: 'file-type',
        name: 'file-name-1',
        ext: 'ext',
        path: 'path/to/file',
      },
      {
        _id: 'file-id-2',
        type: 'file-type',
        name: 'file-name-2',
        ext: 'ext',
        path: 'path/to/file',
      },
    ];
    const jsonArg = [
      {
        id: 'file-id-1',
        type: 'file-type',
        name: 'file-name-1.ext',
        path: 'https://host/path/to/file',
      },
      {
        id: 'file-id-2',
        type: 'file-type',
        name: 'file-name-2.ext',
        path: 'https://host/path/to/file',
      },
    ];
    sinon.stub(File, 'find').returns(findResult);
    sinon.replace(process, 'env', { HOST: 'https://host' });

    await storage.getFiles(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(jsonArg);
  });

  it('should call next() with error with statusCode: 500 is some error occur', async () => {
    const req = { userId: 'user-id' };
    const nextFake = jest.fn(arg => {});
    sinon.stub(File, 'find').returns([{}]);

    await storage.getFiles(req, {}, nextFake);

    expect(nextFake).toHaveBeenCalledWith(expect.any(Error));
    expect(nextFake).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});

describe('/controller/storage.js - uploadFiles', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should call File.find() with proper arguments', async () => {
    const req = {
      userId: 'user-id',
      files: [
        { originalname: 'new-file-1.jpg', size: 1000 },
        { originalname: 'new-file-2.png', size: 2000 },
      ],
    };
    const res = { status: () => res, json: () => {} };
    const storedFiles = [
      { name: 'old-file-1', ext: 'jpg' },
      { name: 'old-file-2', ext: 'png' },
    ];
    const savedFile = {
      _id: 'saved-file-id',
      type: 'saved-file-type',
      name: 'saved-file-name',
      ext: 'saved-file-ext',
      path: 'saved-file-path',
    };
    const findStub = sinon.stub(File, 'find').returns(storedFiles);
    sinon.stub(File.prototype, 'save').returns(savedFile);
    sinon.replace(process, 'env', { HOST: 'https://host' });
    sinon.stub(User, 'findById').returns({ files: [], save: () => {} });

    await storage.uploadFiles(req, res, () => {});

    sinon.assert.calledOnceWithExactly(
      findStub,
      { owner: req.userId },
      { _id: 0, name: 1, ext: 1 }
    );
  });

  it('should send proper response if files update limit was reached', async () => {
    const req = { userId: 'user-id' };
    const res = { status: jest.fn(arg => res), json: jest.fn(arg => {}) };
    const jsonExpected = {
      message: "You can't add new files. Number of files limited to 20",
      addedFiles: [],
    };
    const storedFiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    sinon.stub(File, 'find').returns(storedFiles);
    await storage.uploadFiles(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(jsonExpected);
  });

  it('should skip file if exists in database & call File.save() for every file to store', async () => {
    const req = {
      userId: 'user-id',
      files: [
        { originalname: 'old-file-1.jpg', size: 1000 },
        { originalname: 'new-file-2.png', size: 2000 },
        { originalname: 'new-file-3.rar', size: 1500 },
      ],
    };
    const res = { status: () => res, json: () => {} };
    const storedFiles = [
      { name: 'old-file-1', ext: 'jpg' },
      { name: 'old-file-2', ext: 'png' },
    ];
    const savedFile = {
      _id: 'saved-file-id',
      type: 'saved-file-type',
      name: 'saved-file-name',
      ext: 'saved-file-ext',
      path: 'saved-file-path',
    };
    sinon.stub(File, 'find').returns(storedFiles);
    const saveStub = sinon.stub(File.prototype, 'save').returns(savedFile);
    sinon.replace(process, 'env', { HOST: 'https://host' });
    sinon.stub(User, 'findById').returns({ files: [], save: () => {} });

    await storage.uploadFiles(req, res, () => {});

    sinon.assert.callCount(saveStub, 2);
  });

  it('should call User.findById() with proper argument for every uploaded file', async () => {
    const req = {
      userId: 'user-id',
      files: [
        { originalname: 'new-file-1.jpg', size: 1000 },
        { originalname: 'new-file-2.png', size: 2000 },
      ],
    };
    const res = { status: () => res, json: () => {} };
    const storedFiles = [
      { name: 'old-file-1', ext: 'jpg' },
      { name: 'old-file-2', ext: 'png' },
    ];
    const savedFile = {
      _id: 'saved-file-id',
      type: 'saved-file-type',
      name: 'saved-file-name',
      ext: 'saved-file-ext',
      path: 'saved-file-path',
    };
    sinon.stub(File, 'find').returns(storedFiles);
    sinon.stub(File.prototype, 'save').returns(savedFile);
    sinon.replace(process, 'env', { HOST: 'https://host' });
    const findByIdStub = sinon.stub(User, 'findById').returns({ files: [], save: () => {} });

    await storage.uploadFiles(req, res, () => {});

    sinon.assert.calledWithExactly(findByIdStub, req.userId);
    sinon.assert.callCount(findByIdStub, 2);
  });

  it('should call User.save() for every uploaded file', async () => {
    const req = {
      userId: 'user-id',
      files: [
        { originalname: 'new-file-1.jpg', size: 1000 },
        { originalname: 'new-file-2.png', size: 2000 },
      ],
    };
    const res = { status: () => res, json: () => {} };
    const storedFiles = [
      { name: 'old-file-1', ext: 'jpg' },
      { name: 'old-file-2', ext: 'png' },
    ];
    const savedFile = {
      _id: 'saved-file-id',
      type: 'saved-file-type',
      name: 'saved-file-name',
      ext: 'saved-file-ext',
      path: 'saved-file-path',
    };
    const saveFake = jest.fn(() => {});
    sinon.stub(File, 'find').returns(storedFiles);
    sinon.stub(File.prototype, 'save').returns(savedFile);
    sinon.replace(process, 'env', { HOST: 'https://host' });
    sinon.stub(User, 'findById').returns({ files: [], save: saveFake });

    await storage.uploadFiles(req, res, () => {});

    expect(saveFake).toHaveBeenCalledTimes(2);
  });

  it('should call res.status().json() if no error occur', async () => {
    const req = {
      userId: 'user-id',
      files: [
        { originalname: 'new-file-1.jpg', size: 1000 },
        { originalname: 'new-file-2.png', size: 2000 },
      ],
    };
    const res = { status: jest.fn(arg => res), json: jest.fn(arg => {}) };
    const storedFiles = [
      { name: 'old-file-1', ext: 'jpg' },
      { name: 'old-file-2', ext: 'png' },
    ];
    const savedFile = {
      _id: 'saved-file-id',
      type: 'saved-file-type',
      name: 'saved-file-name',
      ext: 'saved-file-ext',
      path: 'saved-file-path',
    };
    const jsonExpected = {
      addedFiles: [
        {
          id: 'saved-file-id',
          name: 'saved-file-name.saved-file-ext',
          path: 'https://host/saved-file-path',
          type: 'saved-file-type',
        },
        {
          id: 'saved-file-id',
          name: 'saved-file-name.saved-file-ext',
          path: 'https://host/saved-file-path',
          type: 'saved-file-type',
        },
      ],
      message: '2 new files added',
    };
    sinon.stub(File, 'find').returns(storedFiles);
    sinon.stub(File.prototype, 'save').returns(savedFile);
    sinon.replace(process, 'env', { HOST: 'https://host' });
    sinon.stub(User, 'findById').returns({ files: [], save: () => {} });

    await storage.uploadFiles(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(jsonExpected);
  });

  it('should call next() with error with statusCode: 500 if some error occur', async () => {
    const req = {
      userId: 'user-id',
      files: [
        { originalname: 'new-file-1.jpg', size: 1000 },
        { originalname: 'new-file-2.png', size: 2000 },
      ],
    };
    const storedFiles = [
      { name: 'old-file-1', ext: 'jpg' },
      { name: 'old-file-2', ext: 'png' },
    ];
    const nextFake = jest.fn(() => {});
    sinon.stub(File, 'find').returns(storedFiles);
    sinon.stub(File.prototype, 'save').throws();
    sinon.replace(process, 'env', { HOST: 'https://host' });

    await storage.uploadFiles(req, {}, nextFake);

    expect(nextFake).toHaveBeenCalledWith(expect.any(Error));
    expect(nextFake).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});
