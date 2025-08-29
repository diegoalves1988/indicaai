const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Sucesso: adiciona amizade
test('addFriend adiciona amizade entre usuários', async (t) => {
  mock.reset();
  const doc = mock.fn((db, col, id) => ({ id }));
  const getDoc = mock.fn(async () => ({ exists: () => true }));
  const commit = mock.fn(async () => {});
  const batch = { update: mock.fn(), commit };
  const writeBatch = mock.fn(() => batch);
  const arrayUnion = (id) => ({ op: 'arrayUnion', id });

  mock.module('firebase/firestore', {
    doc,
    getDoc,
    writeBatch,
    arrayUnion,
  });
  mock.module(path.resolve(__dirname, 'firebase.ts'), { db: {} });

  const { addFriend } = await import('./userService.ts');

  await addFriend('u1', 'u2');

  assert.strictEqual(batch.update.mock.callCount(), 2);
  assert.strictEqual(commit.mock.callCount(), 1);
});

// Erro: usuário não encontrado
test('addFriend lança erro se usuário inexistente', async (t) => {
  mock.reset();
  const doc = mock.fn((db, col, id) => ({ id }));
  let getDocCall = 0;
  const getDoc = mock.fn(async () => {
    getDocCall++;
    return getDocCall === 1
      ? { exists: () => false }
      : { exists: () => true };
  });
  const writeBatch = mock.fn();
  const arrayUnion = (id) => ({ op: 'arrayUnion', id });

  mock.module('firebase/firestore', {
    doc,
    getDoc,
    writeBatch,
    arrayUnion,
  });
  mock.module(path.resolve(__dirname, 'firebase.ts'), { db: {} });

  const { addFriend } = await import('./userService.ts');

  await assert.rejects(() => addFriend('u1', 'u2'), /Usuário não encontrado/);
});

// Utilitário para mocks de Firestore não usados no teste
function mockFirestoreBase() {
  return {
    doc: mock.fn(),
    getDoc: mock.fn(),
    updateDoc: mock.fn(),
    writeBatch: mock.fn(),
    arrayUnion: mock.fn(),
    arrayRemove: mock.fn(),
    getDocs: mock.fn(),
    collection: mock.fn(),
    serverTimestamp: mock.fn(),
    addDoc: mock.fn(),
  };
}

// Sucesso: upload da imagem de perfil
test('uploadProfileImage envia imagem e atualiza perfil', async (t) => {
  mock.reset();
  mock.module('firebase/firestore', mockFirestoreBase());
  const ref = mock.fn((storage, path) => ({ fullPath: path }));
  let firstCall = true;
  const getDownloadURL = mock.fn(async () => {
    if (firstCall) {
      firstCall = false;
      throw { code: 'storage/object-not-found' };
    }
    return 'https://url/profile.jpg';
  });
  const deleteObject = mock.fn(async () => undefined);
  const uploadBytesResumable = mock.fn(() => ({
    snapshot: { ref: 'ref' },
    on: (state, progressCb, errorCb, successCb) => { successCb(); },
  }));

  mock.module('firebase/storage', {
    ref,
    getDownloadURL,
    deleteObject,
    uploadBytesResumable,
  });
  mock.module(path.resolve(__dirname, 'firebase.ts'), { db: {}, storage: {} });

  const fetchMock = mock.fn(async () => ({ blob: async () => ({ size: 1 }) }));
  mock.method(global, 'fetch', fetchMock);

  const userService = await import('./userService.ts');
  const updateUserProfileMock = mock.method(userService, 'updateUserProfile', async () => {});
  const { uploadProfileImage } = userService;

  const url = await uploadProfileImage('u1', 'http://img');

  assert.strictEqual(url, 'https://url/profile.jpg');
  assert.strictEqual(updateUserProfileMock.mock.callCount(), 1);
  assert.deepStrictEqual(updateUserProfileMock.mock.calls[0].arguments, ['u1', { photoURL: 'https://url/profile.jpg' }]);
});

// Erro: falha no upload da imagem
test('uploadProfileImage rejeita em caso de erro no upload', async (t) => {
  mock.reset();
  mock.module('firebase/firestore', mockFirestoreBase());
  const ref = mock.fn((storage, path) => ({ fullPath: path }));
  const getDownloadURL = mock.fn(async () => { throw { code: 'storage/object-not-found' }; });
  const deleteObject = mock.fn(async () => {});
  const uploadBytesResumable = mock.fn(() => ({
    snapshot: { ref: 'ref' },
    on: (state, progressCb, errorCb, successCb) => {
      errorCb(new Error('upload error'));
    },
  }));

  mock.module('firebase/storage', {
    ref,
    getDownloadURL,
    deleteObject,
    uploadBytesResumable,
  });
  mock.module(path.resolve(__dirname, 'firebase.ts'), { db: {}, storage: {} });

  mock.method(global, 'fetch', async () => ({ blob: async () => ({ size: 1 }) }));

  const userService = await import('./userService.ts');
  const updateUserProfileMock = mock.method(userService, 'updateUserProfile', async () => {});
  const { uploadProfileImage } = userService;

  await assert.rejects(() => uploadProfileImage('u1', 'http://img'), /upload error/);
  assert.strictEqual(updateUserProfileMock.mock.callCount(), 0);
});
