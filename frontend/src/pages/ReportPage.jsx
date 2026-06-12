import { useEffect, useState } from 'react'
import { api } from '../api'
import { Calendar, CheckCircle2, Clock, AlertCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

function StatusBadge({ status }) {
  const map = {
    pending:     { icon: <Clock size={12} className="text-yellow-500" />, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'pending' },
    in_progress: { icon: <AlertCircle size={12} className="text-blue-500" />, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'in progress' },
    completed:   { icon: <CheckCircle2 size={12} className="text-green-500" />, color: 'bg-green-50 text-green-700 border-green-200', label: 'completed' },
    cancelled:   { icon: <XCircle size={12} className="text-gray-400" />, color: 'bg-gray-50 text-gray-400 border-gray-200', label: 'cancelled' },
  }
  const s = map[status] || map.pending
  return (
    <span className={'text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 shrink-0 ' + s.color}>
      {s.icon} {s.label}
    </span>
  )
}

export default function ReportPage() {
  const [people, setPeople] = useState([])
  const [personId, setPersonId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState({})
  const [expandedActions, setExpandedActions] = useState({})

  useEffect(() => {
    let cancelled = false
    api.people.list().then(ps => {
      if (!cancelled) {
        setPeople(ps)
        if (ps.length > 0 && !personId) setPersonId(String(ps[0].id))
      }
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.report({
      person_id: personId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }).then(d => {
      if (!cancelled) {
        setData(d)
        setExpandedTopics({})
        setExpandedActions({})
      }
    })
    return () => { cancelled = true }
  }, [personId, dateFrom, dateTo])

  const toggleTopic = (idx) => {
    setExpandedTopics(prev => ({ ...prev, [idx]: !prev[idx] }))
  }
  const toggleAction = (idx) => {
    setExpandedActions(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Unique topics and action items grouped across meetings</p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
        <select value={personId} onChange={e => setPersonId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md">
          <option value="">All people</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-xs text-gray-400">from</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md" />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Meetings" value={data.stats.total_meetings} icon={<Calendar size={16} />} />
            <StatCard label="Unique Topics" value={data.stats.unique_topics} icon={<AlertCircle size={16} />} />
            <StatCard label="Open Actions" value={data.stats.open_actions} icon={<Clock size={16} />} />
            <StatCard label="Completed" value={data.stats.completed_actions} icon={<CheckCircle2 size={16} />} />
          </div>

          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Topics ({data.stats.unique_topics})
            </h3>
            <div className="space-y-1.5">
              {data.topics.map((group, idx) => {
                const latest = group.latest
                const versions = group.versions
                const isExpanded = expandedTopics[idx]
                return (
                  <div key={idx} className="bg-white rounded-lg border border-gray-100">
                    <div
                      onClick={() => toggleTopic(idx)}
                      className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="text-gray-400 shrink-0">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                      <span className="text-xs text-gray-400 w-24 shrink-0">
                        {new Date(latest.meeting_date).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="text-xs text-gray-500 w-20 shrink-0">{latest.person_name}</span>
                      <span className={`text-sm flex-1 ${latest.resolved ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {latest.title}
                      </span>
                      {latest.category && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded shrink-0">
                          {latest.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-300 shrink-0">{versions.length} ver</span>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-50 px-3 py-2 bg-gray-50/50 rounded-b-lg">
                        <div className="text-[10px] text-gray-400 mb-2">Version history (newest first)</div>
                        <div className="space-y-1.5">
                          {versions.map((v, vi) => (
                            <div key={vi} className="flex items-start gap-3 pl-6 pr-2 py-1.5 text-xs">
                              <span className="text-gray-400 w-20 shrink-0 mt-0.5">
                                {new Date(v.meeting_date).toLocaleDateString('zh-CN')}
                              </span>
                              <div className="flex-1 min-w-0">
                                {v.content && (
                                  <div className="text-gray-500 mb-0.5 line-clamp-2">{v.content}</div>
                                )}
                                <div className="flex items-center gap-2">
                                  {v.resolved && (
                                    <span className="text-[10px] px-1 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded">Resolved</span>
                                  )}
                                  {v.carried_from && (
                                    <span className="text-[10px] px-1 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded">Carried from previous</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {data.topics.length === 0 && (
                <div className="text-sm text-gray-400 py-6 text-center">No topics in this period</div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Action Items ({data.stats.open_actions + data.stats.completed_actions})
            </h3>
            <div className="space-y-1.5">
              {data.action_items.map((group, idx) => {
                const latest = group.latest
                const versions = group.versions
                const isExpanded = expandedActions[idx]
                return (
                  <div key={idx} className="bg-white rounded-lg border border-gray-100">
                    <div
                      onClick={() => toggleAction(idx)}
                      className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="text-gray-400 shrink-0">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                      <span className="text-xs text-gray-400 w-24 shrink-0">
                        {new Date(latest.meeting_date).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="text-xs text-gray-500 w-20 shrink-0">{latest.person_name}</span>
                      <span className={`text-sm flex-1 ${latest.status === 'completed' || latest.status === 'cancelled' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {latest.description}
                      </span>
                      <StatusBadge status={latest.status} />
                      {latest.assignee && <span className="text-xs text-gray-400 shrink-0">@{latest.assignee}</span>}
                      <span className="text-xs text-gray-300 shrink-0">{versions.length} ver</span>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-50 px-3 py-2 bg-gray-50/50 rounded-b-lg">
                        <div className="text-[10px] text-gray-400 mb-2">Version history (newest first)</div>
                        <div className="space-y-1.5">
                          {versions.map((v, vi) => (
                            <div key={vi} className="flex items-start gap-3 pl-6 pr-2 py-1.5 text-xs">
                              <span className="text-gray-400 w-20 shrink-0 mt-0.5">
                                {new Date(v.meeting_date).toLocaleDateString('zh-CN')}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-gray-700 ${v.status === 'completed' || v.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}>
                                  {v.description}
                                </div>
                              </div>
                              <StatusBadge status={v.status} />
                              {v.due_date && (
                                <span className="text-gray-400 shrink-0">Due: {new Date(v.due_date).toLocaleDateString('zh-CN')}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {data.action_items.length === 0 && (
                <div className="text-sm text-gray-400 py-6 text-center">No action items in this period</div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
      <div className="p-2 bg-gray-100 rounded-md text-gray-500">{icon}</div>
      <div>
        <div className="text-lg font-semibold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}