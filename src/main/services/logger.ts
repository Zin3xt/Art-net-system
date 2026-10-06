import { app } from 'electron'
import { appendFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

function getLogFile(): string {
  return join(app.getPath('userData'), 'logs', 'artnet-controller.log')
}

async function write(level: Level, message: string): Promise<void> {
  const sanitized = message.replace(/[\r\n]+/g, ' ').slice(0, 2000)
  const line = `${new Date().toISOString()} [${level}] ${sanitized}\n`
  const file = getLogFile()

  await mkdir(dirname(file), { recursive: true })
  await appendFile(file, line, 'utf8')

  if (level === 'ERROR') console.error(line.trim())
  else if (level === 'WARN') console.warn(line.trim())
  else console.log(line.trim())
}

export const logger = {
  debug: (message: string) => write('DEBUG', message),
  info: (message: string) => write('INFO', message),
  warn: (message: string) => write('WARN', message),
  error: (message: string) => write('ERROR', message)
}
