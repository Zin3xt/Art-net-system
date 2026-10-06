import type { IpcMainInvokeEvent } from 'electron'

export function assertTrustedSender(event: IpcMainInvokeEvent): void {
  const url = event.senderFrame?.url ?? ''
  const isLocalDev = url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')
  const isPackagedRenderer = url.startsWith('file://')

  if (!isLocalDev && !isPackagedRenderer) {
    throw new Error('Rejected IPC request from an untrusted renderer origin.')
  }
}
