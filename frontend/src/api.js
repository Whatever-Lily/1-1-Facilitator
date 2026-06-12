const BASE = '/api'

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  console.log(`[API REQUEST] ${options.method || 'GET'} ${url}`, options)
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  console.log(`[API RESPONSE] ${res.status} ${res.statusText} for ${url}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  people: {
    list: () => request('/people'),
    create: (data) => request('/people', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/people/${id}`, { method: 'DELETE' }),
  },
  meetings: {
    list: (params = {}) => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v != null && v !== '')
      )
      const qs = new URLSearchParams(filtered).toString()
      return request(`/meetings${qs ? '?' + qs : ''}`)
    },
    get: (id) => request(`/meetings/${id}`),
    create: (data) => request('/meetings', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/meetings/${id}`, { method: 'DELETE' }),
  },
  topics: {
    create: (meetingId, data) => request(`/meetings/${meetingId}/topics`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/topics/${id}`, { method: 'DELETE' }),
    carry: (meetingId, topicIds) => request(`/meetings/${meetingId}/topics/carry`, { method: 'POST', body: JSON.stringify({ topic_ids: topicIds }) }),
  },
  actions: {
    create: (meetingId, data) => request(`/meetings/${meetingId}/actions`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/actions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/actions/${id}`, { method: 'DELETE' }),
  },
  report: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
    return request(`/report${qs.toString() ? '?' + qs.toString() : ''}`)
  },
}
