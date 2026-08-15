import { createInterface } from 'node:readline'
import { styleText } from 'node:util'

import { DB_NAME } from './constants.js'

import { generateSqlObject, generateTextAnswer } from './ai.js'
import { connectToDatabase } from './db.js'

const database = connectToDatabase(DB_NAME)

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
})

function prompt(text) {
  return new Promise(resolve => rl.question(text, resolve))
}

rl.on('close', () => {
  database.close()
  console.log(styleText('gray', 'Goodbye!'))
  process.exit(0)
})

console.log('\nWelcome to SQL Terminal Agent! Prees CTRL+C to stop to exit.')
while (true) {
  const question = await prompt(styleText(['bold', 'magenta'], 'Question: '))

  if (!question.trim()) {
    continue
  }

  try {
    const sqlObject = await generateSqlObject(question)
    const { sql, explanation } = sqlObject

    console.log(styleText('cyan', '\nSuggested SQL:'))
    console.log(styleText('red'), sql)
    console.log(styleText('cyan', '\nExplanation:'))
    console.log(styleText('yellow', explanation))

    const confirm = await prompt(styleText(['bold', 'green'], '\nDo you want to run SQL coomand? (s/n):'))
    if (confirm.toLowerCase() === 's') {
      const result = await database.prepare().all().map(row => ({ ...row }))
      const answer = await generateTextAnswer({
        question,
        sql,
        rows: result
      })

      console.log(styleText('green', '\nAnswer: '))
      console.log(answer)
    } else {
      console.log(styleText('yellow', 'SQL not executed'))
    }
  } catch (_) {

  }
}