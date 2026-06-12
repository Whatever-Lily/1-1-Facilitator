import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Plus, Calendar, User, ArrowRight, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

const QUARTERS = [
  { label: 'Jan - Mar',  months: [0, 1, 2] },
  { label: 'Apr - Jun',  months: [3, 4, 5] },
  { label: 'Jul - Sep',  months: [6, 7, 8] },
  { label: 'Oct - Dec',  months: [9, 10, 11] },
]

const STATIC_YEARS = [2026, 2027]

function getQuarterOptions() {
  const currentYear = new Date().getFullYear()
  const options = []
  for (const year of STATIC_YEARS) {
    for (let qi = 0; qi < 4; qi++) {
      if (year > currentYear) continue
      const q = QUARTERS[qi]
      options.push({
        value: `${year}-Q${qi + 1}`,
        label: `${q.label} (${year})`,
        date_from: `${year}-${String(q.months[0] + 1).padStart(2, '0')}-01`,
        date_to: `${year}-${String(q.months[2] + 1).padStart(2, '0')}-${String(new Date(year, q.months[2] + 1, 0).getDate()).padStart(2, '0')}`,
      })
    }
  }
  return options
}

export default function Meetings() {
  const [people, setPeople] = useState([])
  const [meetings, setMeetings] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [meetDate, setMeetDate] = useState('')
  const [meetTime, setMeetTime] = useState('')
  
  const [quickStartPerson, setQuickStartPerson] = useState(null)
  const [quickDate, setQuickDate] = useState('')
  const [quickTime, setQuickTime] = useState('')
  
  // Filter & Pagination states
  const [filterPerson, setFilterPerson] = useState('')
  const [filterQuarter, setFilterQuarter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  const navigate = useNavigate()



  
  useEffect(() => {
    let cancelled = false
    api.people.list().then(ps => {
      if (!cancelled) setPeople(ps)
    })
    return () => { cancelled = true }
  }, [])
  
  useEffect(() => {
    let cancelled = false
    const q = { page, page_size: pageSize }
    if (filterPerson) q.person_id = filterPerson
    if (filterQuarter) {
      const opt = quarterOptions.find(o => o.value === filterQuarter)
      if (opt) { q.date_from = opt.date_from; q.date_to = opt.date_to }
    }
    api.meetings.list(q).then(data => {
      if (!cancelled) {
        setMeetings(data.items)
        setTotalPages(data.pages)
      }
    })
    return () => { cancelled = true }
  }, [page, filterPerson, filterQuarter])
  
  // Reset page when filters change
  const handleFilterPersonChange = (v) => {
    setFilterPerson(v)
    setPage(1)
  }
  const handleFilterQuarterChange = (v) => {
    setFilterQuarter(v)
    setPage(1)
  }
  
  const quarterOptions = getQuarterOptions()

  const createScheduledMeeting = async (e) => {
    e.preventDefault()
    if (selectedPersonId && meetDate && meetTime) {
      const dateTimeStr = `${meetDate}T${meetTime}:00`
      await api.meetings.create({ person_id: selectedPersonId, scheduled_at: dateTimeStr })
      setMeetDate('')
      setMeetTime('')
      setSelectedPersonId('')
      setShowNew(false)
      // Reload people list and meetings after schedule
      api.people.list().then(setPeople)
      const q2 = { page: 1, page_size: pageSize }
      if (filterPerson) q2.person_id = filterPerson
      if (filterQuarter) {
        const opt2 = quarterOptions.find(o => o.value === filterQuarter)
        if (opt2) { q2.date_from = opt2.date_from; q2.date_to = opt2.date_to }
      }
      api.meetings.list(q2).then(data => {
        setMeetings(data.items)
        setTotalPages(data.pages)
      })
    }
  }

  const handleQuickStart = async (e) => {
    e.preventDefault()
    if (quickStartPerson && quickDate && quickTime) {
      const dateTimeStr = `${quickDate}T${quickTime}:00`
      const m = await api.meetings.create({ person_id: quickStartPerson.id, scheduled_at: dateTimeStr })
      setQuickStartPerson(null)
      setQuickDate('')
      setQuickTime('')
      navigate(`/meetings/${m.id}?mode=start`)
    }
  }

  const cancelQuickStart = () => {
    setQuickStartPerson(null)
    setQuickDate('')
    setQuickTime('')
  }

  const hourOptions = Array.from({ length: 10 }, (_, i) => (i + 9).toString().padStart(2, '0') + ':00')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">1:1 Meetings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your 1:1 meetings, topics, and action items</p>
        </div>
      </div>

      {quickStartPerson ? (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              Start 1:1 with {quickStartPerson.name}
            </h3>
            <button 
              onClick={cancelQuickStart} 
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <X size={14} /> Cancel
            </button>
          </div>
          <form onSubmit={handleQuickStart} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-blue-800 mb-1 block">Date</label>
                <input 
                  type="date" 
                  value={quickDate} 
                  onChange={e => setQuickDate(e.target.value)} 
                  required 
                  className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-800 mb-1 block">Time</label>
                <select
                  value={quickTime}
                  onChange={e => setQuickTime(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                >
                  <option value="" disabled>Select hour</option>
                  {hourOptions.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="w-full py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors">
              Start Meeting & Record
            </button>
          </form>
        </div>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Schedule 1:1</h3>
            <button
              onClick={() => setShowNew(!showNew)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {showNew && (
            <form onSubmit={createScheduledMeeting} className="flex flex-col gap-3 mb-3 p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Team Member</label>
                <select
                  value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                >
                  <option value="" disabled>Select an existing team member</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.role ? `(${p.role})` : ''}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={meetDate} onChange={e => setMeetDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Time</label>
                  <select
                    value={meetTime}
                    onChange={e => setMeetTime(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                  >
                    <option value="" disabled>Select hour</option>
                    {hourOptions.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => { setShowNew(false); setSelectedPersonId(''); setMeetDate(''); setMeetTime(''); }} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">Schedule</button>
              </div>
            </form>
          )}
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Team Members</h3>
        <div className="grid gap-3">
          {people.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                  <User size={14} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                  {p.role && <div className="text-xs text-gray-500">{p.role}</div>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-500">
                  {p.meeting_count} meetings
                </div>
                <button
                  onClick={() => {
                    setQuickStartPerson(p)
                    const now = new Date()
                    setQuickDate(now.toISOString().split('T')[0])
                    setQuickTime(now.toTimeString().slice(0, 5).substring(0, 2) + ':00')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <Calendar size={12} /> Start 1:1
                </button>
              </div>
            </div>
          ))}
          {people.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center bg-white rounded-lg border border-gray-100">
              No team members yet.
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recent Meetings</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-gray-400" />
              <select
                value={filterPerson}
                onChange={e => handleFilterPersonChange(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="">All Members</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={filterQuarter}
                onChange={e => handleFilterQuarterChange(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="">All Time</option>
                {quarterOptions.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {meetings.map(m => (
            <div
              key={m.id}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-sm text-gray-900">{new Date(m.scheduled_at).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className="text-xs text-gray-400">with</span>
                <span className="text-sm font-medium text-gray-700">{m.person_name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{m.topic_count} topics</span>
                <span>{m.action_count} actions</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center bg-white rounded-lg border border-gray-100">
              No meetings found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 pb-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}