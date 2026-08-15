import { DatabaseSync } from 'node:sqlite'

export function connectToDatabase(path = ':memory:') {
  const database = new DatabaseSync(path)

  database.exec(`
    CREATE TABLE IF NOT EXISTS access_logs (
      ip TEXT NOT NULL,
      username TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      location TEXT NOT NULL,
      job_area TEXT NOT NULL,
      company TEXT NOT NULL,
      job_title TEXT NOT NULL,
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  return database
}

const db = connectToDatabase('access_logs.db')