// @flow
'use strict'

import store from 'local-storage'

const KEY = 'RECENTLY_SUBMITTED_JOBS'

function get() /* : string[] */ {
  return store.get(KEY) || []
}

function set(jobIds /* : string[] */) /* : void */ {
  return store.set(KEY, jobIds)
}

function add(jobId /* : string */) /* : void */ {
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
