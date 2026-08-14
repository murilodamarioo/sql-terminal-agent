import { createWriteStream, statSync } from 'node:fs'
import { faker } from '@faker-js/faker'
import chalk from 'chalk'

import { LOG_FILE, LOG_INTERVAL } from './constants.js'


const maxRecords = Number(process.argv[2] || Infinity)

if (
  (!Number.isInteger(maxRecords) && Number.isFinite(maxRecords))
  || Number.isNaN(maxRecords)
  || maxRecords <= 0
) {
  console.error(chalk.red('Use: npm run seed -- <quantity>'))
  console.error(chalk.red('The quantity must be a integer number and greater than zero'))
  process.exit(1)
}

const stream = createWriteStream(LOG_FILE)

function convertFromByteToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(4)
}

function generateUser() {
  return {
    ip: faker.internet.ip(),
    username: faker.internet.userName(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    location: faker.location.city(),
    job_area: faker.person.jobArea(),
    company: faker.company.name(),
    job_title: faker.person.jobTitle()
  }
}

function generateLogEntry(user) {
  return {
    ...user,
    id: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString()
  }
}

function writeRecord(line) {
  return new Promise((resolve) => {
    if (!stream.write(line)) {
      stream.once('drain', resolve)
    } else {
      resolve()
    }
  })
}

console.log(`Generating fake access in ${LOG_FILE}... (Press Ctrl+C to stop)`)
console.log(`Registers limit: ${maxRecords.toLocaleString()}`)

const users = Array.from({ length: 5 }, generateUser)

process.on('SIGINT', () => {
  stream.end(() => {
    const { size } = statSync(LOG_FILE)
    console.log(
      chalk.yellowBright(`Interrupt received. Registers ${count.toLocaleString()}, File size ${convertFromByteToGB(size)}`)
    )
  })
})

let count = 0
while (count <= maxRecords) {
  const user = faker.helpers.arrayElement(users)

  const record = generateLogEntry(user)
  await writeRecord(JSON.stringify(record) + '\n')

  count++

  if (count % LOG_INTERVAL === 0) {
    const { size } = statSync(LOG_FILE)
    console.log(
      chalk.blue(`Registers: ${count.toLocaleString()}, File size: ${convertFromByteToGB(size)} GB`)
    )
  }
}

stream.end(() => {
  const { size } = statSync(LOG_FILE)
  console.log(
    chalk.green(`Generation Complete. Register: ${count.toLocaleString()}, File size: ${convertFromByteToGB(size)} GB`)
  )
})