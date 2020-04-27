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

describe('/controller/storage.js - downloadFile', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should call File.findById() with proper argument', async () => {
    const req = { params: { id: 'file-id' } };
    const res = { status: () => res, download: () => {} };
    const file = { path: 'path/to/file', name: 'file-name' };
    const stub = sinon.stub(File, 'findById').returns(file);

    await storage.downloadFile(req, res, () => {});

    sinon.assert.calledOnceWithExactly(stub, req.params.id);
  });

  it('should call res.status().download() with proper arguments', async () => {
    const req = { params: { id: 'file-id' } };
    const res = { status: jest.fn(arg => res), download: jest.fn((arg1, arg2, arg3) => {}) };
    const file = { path: 'path/to/file', name: 'file-name' };
    sinon.stub(File, 'findById').returns(file);

    await storage.downloadFile(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.download).toHaveBeenCalledWith(file.path, file.name, expect.any(Function));
  });

  it('should call next() with error with statusCode: 500 if some error occur', async () => {
    const req = { params: { id: 'file-id' } };
    const nextFake = jest.fn(arg => {});
    sinon.stub(File, 'findById').throws();

    await storage.downloadFile(req, {}, nextFake);

    expect(nextFake).toHaveBeenCalledWith(expect.any(Error));
    expect(nextFake).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});

describe('/controller/storage.js - updateFile', () => {
  const req = {
    userId: 'user-id',
    body: {
      id: 'file-id',
      name: 'updated-name',
      ext: 'file-ext',
    },
  };
  const res = { status: () => res, json: () => {} };
  const file = {
    path: 'path/to/file',
    save: () => updatedFile,
  };
  const updatedFile = {
    name: 'updated-file',
    ext: 'rar',
  };

  afterEach(() => {
    sinon.restore();
  });

  it('should call File.findById() with proper arguments', async () => {
    const stub = sinon.stub(File, 'findById').returns({ ...file });
    sinon.stub(fs, 'renameSync');

    await storage.updateFile(req, res, () => {});

    sinon.assert.calledOnceWithExactly(stub, req.body.id);
  });

  it('should call fs.renameSync() with proper arguments', async () => {
    const newPath = `storage/user-${req.userId}/${req.body.name}${req.body.ext}`;
    sinon.stub(File, 'findById').returns({ ...file });
    const stub = sinon.stub(fs, 'renameSync');

    await storage.updateFile(req, res, () => {});

    sinon.assert.calledOnceWithExactly(stub, file.path, newPath);
  });

  it('should call File.save() after update', async () => {
    const file = {
      path: 'path/to/file',
      save: jest.fn(() => updatedFile),
    };
    sinon.stub(File, 'findById').returns({ ...file });
    sinon.stub(fs, 'renameSync');

    await storage.updateFile(req, res, () => {});

    expect(file.save).toHaveBeenCalled();
  });

  it('should call res.status().json() with proper arguments if no error occur', async () => {
    const res = { status: jest.fn(arg => res), json: jest.fn(arg => {}) };
    sinon.stub(File, 'findById').returns({ ...file });
    sinon.stub(fs, 'renameSync');

    await storage.updateFile(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      message: `File "${updatedFile.name}.${updatedFile.ext}" updated`,
    });
  });

  it('should call next() with error with statusCode: 500 if some error occur', async () => {
    const nextFake = jest.fn(arg => {});
    sinon.stub(File, 'findById').throws();

    await storage.updateFile(req, res, nextFake);

    expect(nextFake).toHaveBeenCalledWith(expect.any(Error));
    expect(nextFake).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});

describe('/controller/storage.js - deleteFile', () => {
  const req = { userId: 'user-id', params: { id: 'file-id' } };
  const res = { status: () => res, json: () => {} };
  const deletedFile = { _id: 'deleted-id', name: 'file-name', ext: 'rar' };
  const user = { save: () => {}, files: { pull: () => {} } };

  afterEach(() => {
    sinon.restore();
  });

  it('should call File.findByIdAndRemove() with proper argument', async () => {
    const stub = sinon.stub(File, 'findByIdAndRemove').returns({ ...deletedFile });
    sinon.stub(User, 'findById').returns({ ...user });
    sinon.stub(path, 'join').returns('path/to/file/storage');
    sinon.stub(fs, 'unlink');

    await storage.deleteFile(req, res, () => {});

    sinon.assert.calledOnceWithExactly(stub, req.params.id);
  });

  it('should call User.findById() with proper argument', async () => {
    sinon.stub(File, 'findByIdAndRemove').returns({ ...deletedFile });
    const stub = sinon.stub(User, 'findById').returns({ ...user });
    sinon.stub(path, 'join').returns('path/to/file/storage');
    sinon.stub(fs, 'unlink');

    await storage.deleteFile(req, res, () => {});

    sinon.assert.calledOnceWithExactly(stub, req.userId);
  });

  it('should call user.files.pull() with proper argument', async () => {
    const user = { save: () => {}, files: { pull: jest.fn(arg => {}) } };
    sinon.stub(File, 'findByIdAndRemove').returns({ ...deletedFile });
    sinon.stub(User, 'findById').returns({ ...user });
    sinon.stub(path, 'join').returns('path/to/file/storage');
    sinon.stub(fs, 'unlink');

    await storage.deleteFile(req, res, () => {});

    expect(user.files.pull).toHaveBeenCalledWith(deletedFile._id);
  });

  it('should call user.save()', async () => {
    const user = { save: jest.fn(() => {}), files: { pull: () => {} } };
    sinon.stub(File, 'findByIdAndRemove').returns({ ...deletedFile });
    sinon.stub(User, 'findById').returns({ ...user });
    sinon.stub(path, 'join').returns('path/to/file/storage');
    sinon.stub(fs, 'unlink');

    await storage.deleteFile(req, res, () => {});

    expect(user.save).toHaveBeenCalled();
  });

  it('should call fs.unlink() with proper arguments', async () => {
    const filePath = 'path/to/file/storage';
    const unlinkFake = jest.fn((arg1, arg2) => {});
    sinon.stub(File, 'findByIdAndRemove').returns({ ...deletedFile });
    sinon.stub(User, 'findById').returns({ ...user });
    sinon.stub(path, 'join').returns(filePath);
    sinon.replace(fs, 'unlink', unlinkFake);

    await storage.deleteFile(req, res, () => {});

    expect(unlinkFake).toHaveBeenCalledWith(filePath, expect.any(Function));
  });

  it('should call res.status().json() with proper arguments if no error occur', async () => {
    const res = { status: jest.fn(arg => res), json: jest.fn(arg => {}) };
    const responseExpected = { message: `File "${deletedFile.name}.${deletedFile.ext}" deleted` };
    sinon.stub(File, 'findByIdAndRemove').returns({ ...deletedFile });
    sinon.stub(User, 'findById').returns({ ...user });
    sinon.stub(path, 'join').returns('path/to/file/storage');
    sinon.stub(fs, 'unlink');

    await storage.deleteFile(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(responseExpected);
  });

  it('should call next() with error with statusCode: 500 if some error occur', async () => {
    const nextFake = jest.fn(arg => {});
    sinon.stub(File, 'findByIdAndRemove').returns({ ...deletedFile });
    sinon.stub(User, 'findById').throws();

    await storage.deleteFile(req, res, nextFake);

    expect(nextFake).toHaveBeenCalledWith(expect.any(Error));
    expect(nextFake).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});
