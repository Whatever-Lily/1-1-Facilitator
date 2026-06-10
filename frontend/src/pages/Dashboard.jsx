import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Plus, Calendar, User, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const [people, setPeople] = useState([])
  const [meetings, setMeetings] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const navigate = useNavigate()

  const load = () => {
    api.people.list().then(setPeople)
    api.meetings.list().then(setMeetings)
  }
  useEffect(load, [])

  const createPerson = async (e) => {
    e.preventDefault()
    await api.people.create({ name: newName, role: newRole || null })
    setNewName(''); setNewRole(''); setShowNew(false)
    load()
  }

  const nextMeeting = async (personId) => {
    const m = await api.meetings.create({ person_id: personId })
    navigate(`/meetings/${m.id}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">1:1 Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your 1:1 meetings, topics, and action items</p>
        </div>
      </div>

      {/* People section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Team Members</h3>
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {showNew && (
          <form onSubmit={createPerson} className="flex gap-2 mb-3 p-3 bg-white rounded-lg border border-gray-200">
            <input
              value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Name" required
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <input
              value={newRole} onChange={e => setNewRole(e.target.value)}
              placeholder="Role (optional)"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">Save</button>
          </form>
        )}

        <div className="grid gap-3">
          {people.map(p => {
            const personMeetings = meetings.filter(m => m.person_id === p.id)
            // Compute open action items from the API
            const lastMeeting = personMeetings[0]
            return (
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
                    {personMeetings.length} meetings
                  </div>
                  <button
                    onClick={() => nextMeeting(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-800"
                  >
                    <Calendar size={12} /> Start 1:1
                  </button>
                </div>
              </div>
            )
          })}
          {people.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center bg-white rounded-lg border border-gray-100">
              No team members yet. Add your first direct report above.
            </div>
          )}
        </div>
      </section>

      {/* Recent meetings */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Recent Meetings</h3>
        <div className="space-y-2">
          {meetings.slice(0, 10).map(m => (
            <div
              key={m.id}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-sm text-gray-900">{new Date(m.date).toLocaleDateString('zh-CN')}</span>
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
              No meetings yet. Start a 1:1 above.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
