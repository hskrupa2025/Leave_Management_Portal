const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { matchesLoginPassword, getEmailCandidates, isBcryptHash } = require('../src/controllers/authController');

test('matchesLoginPassword accepts legacy plaintext passwords and bcrypt hashes', async () => {
    const plaintextUser = { password: 'Admin@123' };
    const hashedUser = { passwordHash: await bcrypt.hash('Employee@123', 10) };

    assert.equal(await matchesLoginPassword(plaintextUser, 'Admin@123'), true);
    assert.equal(await matchesLoginPassword(hashedUser, 'Employee@123'), true);
    assert.equal(await matchesLoginPassword({ passwordHash: await bcrypt.hash('OtherPass', 10) }, 'WrongPass'), false);
});

test('getEmailCandidates normalizes the same email across casing and spacing', () => {
    const candidates = getEmailCandidates(' Krupa@Exelon.com ');

    assert.ok(candidates.includes('krupa@exelon.com'));
    assert.ok(candidates.includes('Krupa@Exelon.com'));
});

test('isBcryptHash distinguishes hashed passwords from legacy plaintext values', () => {
    assert.equal(isBcryptHash('$2b$10$hash'), true);
    assert.equal(isBcryptHash('Employee@123'), false);
});
