import { useEffect, useState } from 'react'
import { api } from '../api'
import { Calendar, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'

const statusIcons = {
  pending: <Clock size={12} className="text-yellow-500" />,
  in_progress: <AlertCircle size={12} className="text-blue-500" />,
  completed: <CheckCircle2 size={12} className="text-green-500" />,
  cancelled: <XCircle size={12} className="text-gray-400" />,
}

const statusColor = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-400 border-gray-200',
}

export default function ReportPage() {
  const [people, setPeople] = useState([])
  const [personId, setPersonId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    api.people.list().then(ps => {
      setPeople(ps)
      if (ps.length > 0 && !personId) setPersonId(String(ps[0].id))
    })
  }, [])

  useEffect(() => {
    api.report({
      person_id: personId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }).then(setData)
  }, [personId, dateFrom, dateTo])

  const selectedPerson = people.find(p => String(p.id) === personId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Highlight summaries and action item status across time</p>
      </div>

      {/* Filters */}
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
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Meetings" value={data.stats.total_meetings} icon={<Calendar size={16} />} />
            <StatCard label="Topics" value={data.stats.total_topics} icon={<AlertCircle size={16} />} />
            <StatCard label="Open Actions" value={data.stats.open_actions} icon={<Clock size={16} />} />
            <StatCard label="Completed" value={data.stats.completed_actions} icon={<CheckCircle2 size={16} />} />
          </div>

          {/* Topic Highlights */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Topic Highlights</h3>
            <div className="space-y-1.5">
              {data.topic_highlights.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 w-24 shrink-0">
                    {new Date(t.meeting_date).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-xs text-gray-500 w-20 shrink-0">{t.person_name}</span>
                  <span className={`text-sm ${t.resolved ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</span>
                  {t.category && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{t.category}</span>
                  )}
                  {t.carried_from && <span className="text-xs text-orange-500 ml-auto" title="Carried from previous meeting">↻ carried</span>}
                </div>
              ))}
              {data.topic_highlights.length === 0 && (
                <div className="text-sm text-gray-400 py-6 text-center">No topics in this period</div>
              )}
            </div>
          </section>

          {/* Action Items */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Action Items</h3>
            <div className="space-y-1.5">
              {data.action_items.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 w-24 shrink-0">
                    {new Date(a.meeting_date).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-xs text-gray-500 w-20 shrink-0">{a.person_name}</span>
                  <span className={`text-sm flex-1 ${a.status === 'completed' || a.status === 'cancelled' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {a.description}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${statusColor[a.status] || ''}`}>
                    {statusIcons[a.status]} {a.status.replace('_', ' ')}
                  </span>
                  {a.assignee && <span className="text-xs text-gray-400">@{a.assignee}</span>}
                </div>
              ))}
              {(!data.action_items || data.action_items.length === 0) && (
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
