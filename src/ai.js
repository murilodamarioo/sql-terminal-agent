import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import chalk from 'chalk'

const SCHEMA_DESCRIPTION = `
  Table: access_logs
  Columns:
    - ip TEXT NOT NULL,
    - username TEXT NOT NULL,
    - first_name TEXT NOT NULL,
    - last_name TEXT NOT NULL,
    - email TEXT NOT NULL,
    - location TEXT NOT NULL,
    - job_area TEXT NOT NULL,
    - company TEXT NOT NULL,
    - job_title TEXT NOT NULL,
    - id TEXT PRIMARY KEY,
    - timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
`

const BLOCKED_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'REPLACE',
  'PRAGMA',
  'ATTACH',
  'DETACH',
  'VACUUM'
]

const sqlSuggestionSchema = z.object({
  sql: z.string(),
  explanation: z.string()
})

export function validateSql(sql) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('Empty SQL')
  }

  const safeSql = sql.trim().replace(/;\*$/, '').trim()

  for (const keyword of BLOCKED_KEYWORDS) {
    if (new RegExp(`\\b${keyword}\\b`, i).test(safeSql)) {
      throw new Error(`Command blocked: ${keyword}`)
    }
  }

  return safeSql
}

const model = openai('gpt-4o-mini', {
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateSqlObject(question) {
  const { experimental_output } = await generateText({
    model,
    experimental_output: Output.object({ schema: sqlSuggestionSchema }),
    system: `
      You are an expert SQLite assistant.

      Your task is to generate a single SQL query to answer the user's question.

      Mandatory rules:
      - Generate only SELECT statements.
      - Use only the access_logs table.
      - Do not use ${BLOCKED_KEYWORDS.join(', ')}.
      - Do not generate multiple queries.
      - Do not use SQL comments.
      - If the question cannot be answered from the available schema, generate a simple inspection query or explain the limitation.

      Available schema:
      ${SCHEMA_DESCRIPTION}`,
    prompt: `
      User question:
      ${question}
    `,
  });

  if (!experimental_output?.sql) {
    throw new Error(chalk.red('The model did not return a valid SQL suggestion.'));
  }

  return {
    sql: validateSql(experimental_output.sql),
    explanation: experimental_output.explanation,
  };
}

const { sql, explanation } = await generateSqlObject('How many access we have per location')

console.log('Generated SQL: ', sql),
console.log('Explanation: ', explanation)