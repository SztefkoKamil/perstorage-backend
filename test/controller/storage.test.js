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
