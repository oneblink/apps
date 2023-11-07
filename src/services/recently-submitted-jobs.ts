const KEY = 'RECENTLY_SUBMITTED_JOBS'

function get(): string[] {
  const item = localStorage.getItem(KEY)
  if (!item) {
    return []
  }
  return JSON.parse(item)
}

function set(jobIds: string[]) {
  return localStorage.setItem(KEY, JSON.stringify(jobIds))
}

function add(jobId: string): void | boolean {
  const jobIds = get()
  if (!jobIds.some((id) => id === jobId)) {
    jobIds.push(jobId)
    return set(jobIds)
  }
}

export default {
  get,
  set,
  add,
}
