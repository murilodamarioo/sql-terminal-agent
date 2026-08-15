import chalk from 'chalk'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

import { LOG_FILE, LOG_INTERVAL } from './constants.js'
import { connectToDatabase } from './db.js'

const database = connectToDatabase()

const fileStream = createReadStream(LOG_FILE)
const rl = createInterface({
  input: fileStream,
  crlDelay: Infinity
})
console.log(chalk.yellow(`Reading ${LOG_FILE} and ingest into database...`))

let count = 0
for await (const line of rl) {
  if (!line.trim()) continue

  let record
  try {
    record = JSON.parse(line)
  } catch (_) {
    continue
  }

  database.prepare(`
    INSERT INTO access_logs
    (
      ip,
      username,
      first_name,
      last_name,
      email,
      location,
      job_area,
      company,
      job_title,
      id,
      timestamp
    )
    VALUES
    (?,?,?,?,?,?,?,?,?,?,?)
  `)
    .run(
      record.ip,
      record.username,
      record.first_name,
      record.last_name,
      record.email,
      record.location,
      record.job_area,
      record.company,
      record.job_title,
      record.id,
      record.timestamp
    )
  count++

  if (count % LOG_INTERVAL === 0) {
    console.log(chalk.blueBright(`Registers ingested: ${count}`))
  }
}

console.log(chalk.green(`Ingest complete. Total of ingested registers: ${count}`))
database.close()