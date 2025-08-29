const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Sucesso: usuário recomenda profissional pela primeira vez
test('recommendProfessional adiciona recomendação', async (t) => {
  const docRef = {};
  const doc = mock.fn(() => docRef);
  const getDoc = mock.fn(async () => ({
    exists: () => true,
    data: () => ({ recommendedBy: [] }),
  }));
  const updateDoc = mock.fn(async () => {});
  const arrayUnion = (...args) => ({ op: 'arrayUnion', args });
  const increment = (n) => ({ op: 'increment', n });

  mock.module('firebase/firestore', {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    increment,
  });
  mock.module(path.resolve(__dirname, 'firebase.ts'), { db: {} });

  const { recommendProfessional } = await import('./professionalService.ts');

  await recommendProfessional('prof1', 'user1');

  assert.strictEqual(updateDoc.mock.callCount(), 1);
  assert.deepStrictEqual(updateDoc.mock.calls[0].arguments[1], {
    recommendedBy: { op: 'arrayUnion', args: ['user1'] },
    recommendationCount: { op: 'increment', n: 1 },
  });
});

// Erro: falha ao atualizar documento
test('recommendProfessional registra erro quando updateDoc falha', async (t) => {
  const doc = mock.fn(() => ({}));
  const getDoc = mock.fn(async () => ({
    exists: () => true,
    data: () => ({ recommendedBy: [] }),
  }));
  const updateDoc = mock.fn(async () => {
    throw new Error('firestore fail');
  });
  const arrayUnion = (...args) => ({ op: 'arrayUnion', args });
  const increment = (n) => ({ op: 'increment', n });
  const consoleError = mock.method(console, 'error');

  mock.module('firebase/firestore', {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    increment,
  });
  mock.module(path.resolve(__dirname, 'firebase.ts'), { db: {} });

  const { recommendProfessional } = await import('./professionalService.ts');

  await recommendProfessional('prof1', 'user1');

  assert.strictEqual(consoleError.mock.callCount(), 1);
});
