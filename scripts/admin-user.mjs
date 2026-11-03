#!/usr/bin/env node
/**
 * Beheeraccounts voor Top Locaties (wachtwoorden alleen als scrypt-hash).
 *
 *   node scripts/admin-user.mjs add <email> <redacteur|hoofdredacteur> [naam]   # wachtwoord via stdin
 *   node scripts/admin-user.mjs list
 *   node scripts/admin-user.mjs remove <email>
 *   node scripts/admin-user.mjs export      # JSON voor de omgevingsvariabele TL_ADMIN_USERS
 *
 * Opslag: .admin/users.json (staat in .gitignore — nooit committen).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const USERS_FILE = path.join(root, '.admin/users.json');
const ROLES = ['redacteur', 'hoofdredacteur'];
const PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64, PARAMS).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored).split('$');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64, PARAMS);
  const ref = Buffer.from(hash, 'hex');
  return ref.length === test.length && crypto.timingSafeEqual(test, ref);
}
export function loadUsers() {
  const fromEnv = process.env.TL_ADMIN_USERS ? JSON.parse(process.env.TL_ADMIN_USERS) : [];
  const fromFile = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) : [];
  return [...fromEnv, ...fromFile];
}
const save = (users) => {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 });
};
const readStdin = () => new Promise((resolve) => {
  let d = '';
  process.stdin.on('data', (c) => { d += c; });
  process.stdin.on('end', () => resolve(d.replace(/\r?\n$/, '')));
});

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, email, role, ...nameParts] = process.argv.slice(2);
  const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) : [];
  if (cmd === 'add') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '') || !ROLES.includes(role)) {
      console.error('Gebruik: add <email> <redacteur|hoofdredacteur> [naam]  (wachtwoord via stdin)');
      process.exit(1);
    }
    const password = await readStdin();
    if (password.length < 10) { console.error('Wachtwoord: minimaal 10 tekens.'); process.exit(1); }
    const rest = users.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    rest.push({ email: email.toLowerCase(), role, name: nameParts.join(' ') || email.split('@')[0], passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
    save(rest);
    console.log(`Account ${email} (${role}) opgeslagen in .admin/users.json`);
  } else if (cmd === 'list') {
    for (const u of loadUsers()) console.log(`${u.email.padEnd(32)} ${u.role.padEnd(15)} ${u.name}`);
  } else if (cmd === 'remove') {
    save(users.filter((u) => u.email.toLowerCase() !== String(email).toLowerCase()));
    console.log(`Account ${email} verwijderd`);
  } else if (cmd === 'export') {
    console.log(JSON.stringify(users));
  } else {
    console.error('Commando: add | list | remove | export');
    process.exit(1);
  }
}
