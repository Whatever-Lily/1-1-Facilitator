import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import {
  ArrowLeft, Plus, MoreHorizontal, Trash2, Flame
} from 'lucide-react'

const STATUS_OPTS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const CATEGORIES = ['Performance', 'Career Growth', 'Project Updates', 'Blockers', 'Wellbeing', 'Feedback', 'Other']

function TopicRow({ topic, onUpdate, onDelete }) {
  const [edit, setEdit] = useState(false)
  const [title, setTitle] = useState(topic.title)
  const [content, setContent] = useState(topic.content || '')
  const [cat, setCat] = useState(topic.category || '')
  const [resolved, setResolved] = useState(topic.resolved)

  const save = () => {
    onUpdate(topic.id, { title, content: content || null, category: cat || null, resolved })
    setEdit(false)
  }

  if (edit) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md" placeholder="Topic title" />
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={2}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md" placeholder="Notes..." />
        <div className="flex gap-2 items-center">
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded-md">
            <option value="">No category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input type="checkbox" checked={resolved} onChange={e => setResolved(e.target.checked)} />
            Resolved
          </label>
          <div className="flex-1" />
          <button onClick={() => setEdit(false)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={save} className="px-2 py-1 text-xs bg-gray-900 text-white rounded">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start justify-between p-3 rounded-lg border group transition-colors
      ${resolved ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {topic.carried_from_meeting_id && <Flame size={12} className="text-orange-400 shrink-0" title="Carried from previous meeting" />}
          <span className={`text-sm ${resolved ? 'line-through text-gray-400' : 'text-gray-900'}`}>{topic.title}</span>
          {topic.category && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{topic.category}</span>
          )}
        </div>
        {topic.content && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{topic.content}</div>
        )}
      </div>
      <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEdit(true)} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Edit">
          <MoreHorizontal size={14} />
        </button>
        <button onClick={() => onDelete(topic.id)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function ActionRow({ action, onUpdate, onDelete }) {
  const cmp = action.status === 'completed' || action.status === 'cancelled'

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border group ${cmp ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'}`}>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${cmp ? 'line-through text-gray-400' : 'text-gray-900'}`}>{action.description}</div>
        <div className="flex gap-3 mt-1">
          {action.assignee && <span className="text-xs text-gray-500">@{action.assignee}</span>}
          {action.due_date && <span className="text-xs text-gray-400">Due: {new Date(action.due_date).toLocaleDateString('zh-CN')}</span>}
        </div>
      </div>
      <select value={action.status} onChange={e => onUpdate(action.id, { status: e.target.value })}
        className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white">
        {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <button onClick={() => onDelete(action.id)} className="p-1 ml-1 text-gray-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function MeetingPage() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [newTopic, setNewTopic] = useState('')
  const [newAction, setNewAction] = useState('')
  const [newActionAssignee, setNewActionAssignee] = useState('')
  const [notes, setNotes] = useState('')
  const meetId = parseInt(id)

  const load = async () => {
    const m = await api.meetings.get(meetId)
    setMeeting(m)
    setNotes(m.notes || '')
  }
  useEffect(() => { load() }, [meetId])

  const saveNotes = async () => {
    await fetch(`/api/meetings/${meetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
  }

  const addTopic = async () => {
    if (!newTopic.trim()) return
    await api.topics.create(meetId, { title: newTopic.trim() })
    setNewTopic('')
    load()
  }

  const updateTopic = (id, data) => api.topics.update(id, data).then(load)
  const deleteTopic = (id) => {
    if (!confirm('Delete this topic?')) return
    api.topics.delete(id).then(load)
  }

  const addAction = async () => {
    if (!newAction.trim()) return
    await api.actions.create(meetId, {
      description: newAction.trim(),
      assignee: newActionAssignee.trim() || null,
    })
    setNewAction('')
    setNewActionAssignee('')
    load()
  }

  const updateAction = (id, data) => api.actions.update(id, data).then(load)
  const deleteAction = (id) => {
    if (!confirm('Delete this action item?')) return
    api.actions.delete(id).then(load)
  }

  if (!meeting) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>

  const unresolvedTopics = meeting.topics?.filter(t => !t.resolved) || []
  const resolvedTopics = meeting.topics?.filter(t => t.resolved) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">
            1:1 with {meeting.person_name || meeting.person?.name || 'Unknown'}
          </h2>
          <p className="text-sm text-gray-500">{new Date(meeting.date).toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          placeholder="General notes for this 1:1..."
        />
      </div>

      <section>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Topics ({meeting.topics?.length || 0})
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTopic()}
            placeholder="Add a topic..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button onClick={addTopic}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="space-y-2">
          {unresolvedTopics.map(t => (
            <TopicRow key={t.id} topic={t} onUpdate={updateTopic} onDelete={deleteTopic} />
          ))}
          {resolvedTopics.length > 0 && (
            <>
              <div className="text-xs text-gray-400 pt-2 pb-1">Resolved</div>
              {resolvedTopics.map(t => (
                <TopicRow key={t.id} topic={t} onUpdate={updateTopic} onDelete={deleteTopic} />
              ))}
            </>
          )}
          {(!meeting.topics || meeting.topics.length === 0) && (
            <div className="text-sm text-gray-400 py-6 text-center">No topics yet</div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Action Items ({meeting.action_items?.length || 0})
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAction()}
            placeholder="New action item..."
            className="flex-[2] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <input
            value={newActionAssignee}
            onChange={e => setNewActionAssignee(e.target.value)}
            placeholder="Assignee"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button onClick={addAction}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="space-y-2">
          {meeting.action_items?.map(a => (
            <ActionRow key={a.id} action={a} onUpdate={updateAction} onDelete={deleteAction} />
          ))}
          {(!meeting.action_items || meeting.action_items.length === 0) && (
            <div className="text-sm text-gray-400 py-6 text-center">No action items yet</div>
          )}
        </div>
      </section>
    </div>
  )
}
