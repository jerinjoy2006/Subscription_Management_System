import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../../subscriptiq.db');

sqlite3.verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database:', err.message);
  } else {
    console.log(`Connected to local SQLite database at: ${dbPath}`);
    db.run(`PRAGMA foreign_keys = ON;`);
    db.run(`PRAGMA journal_mode = WAL;`);
  }
});

// Promisified query helper methods
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

/**
 * Generates next sequential identifier, e.g. SUB-2026-0005, INV-2026-0005
 * Avoids duplicate key collisions even if records are deleted or sparse.
 */
export const getNextSequenceNumber = async (prefix, table, column, padLength = 4) => {
  const year = new Date().getFullYear();
  const searchPattern = `${prefix}-${year}-%`;
  const latestRow = await get(`SELECT ${column} as num FROM ${table} WHERE ${column} LIKE ? ORDER BY id DESC LIMIT 1;`, [searchPattern]);
  if (!latestRow || !latestRow.num) {
    return `${prefix}-${year}-${String(1).padStart(padLength, '0')}`;
  }
  const parts = latestRow.num.split('-');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}-${year}-${String(nextSeq).padStart(padLength, '0')}`;
};

export default db;

