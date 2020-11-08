import * as store from 'local-storage'

const KEY = 'RECENTLY_SUBMITTED_JOBS'

function get(): string[] {
  return store.get(KEY) || []
}

function set(jobIds: string[]): boolean {
  return store.set(KEY, jobIds)
}

function add(jobId: string): void | boolean {
  const jobIds = get()
  if (!jobIds.some((id) => id === jobId)) {
    jobIds.push(jobId)
    return store.set(KEY, jobIds)
  }
}

export default {
  get,
  set,
  add,
}
