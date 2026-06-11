import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Flame } from 'lucide-react'


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

  const handleSave = () => {
    onUpdate({ ...topic, title, content: content || null, category: cat || null, resolved })
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
          <button onClick={handleSave} className="px-2 py-1 text-xs bg-gray-900 text-white rounded">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start justify-between p-3 rounded-lg border group transition-colors
      ${resolved ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {topic.carried_from_meeting_id && (
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded shrink-0 flex items-center gap-1">
              <Flame size={10} /> Continued
            </span>
          )}
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
      <select value={action.status} onChange={e => {
        onUpdate({ ...action, status: e.target.value })
      }}
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isStartMode = searchParams.get('mode') === 'start'
  const meetId = parseInt(id)

  const [meeting, setMeeting] = useState(null)
  
  // Draft states
  const [draftNotes, setDraftNotes] = useState('')
  const [draftTopics, setDraftTopics] = useState([])
  const [draftActions, setDraftActions] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Local input states for adding new items
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newActionDesc, setNewActionDesc] = useState('')
  const [newActionAssignee, setNewActionAssignee] = useState('')

  const load = async () => {
    const m = await api.meetings.get(meetId)
    setMeeting(m)
    setDraftNotes(m.notes || '')
    setDraftTopics(m.topics || [])
    setDraftActions(m.action_items || [])
    setIsDirty(false) // Reset dirty flag on fresh load
  }
  useEffect(() => { load() }, [meetId])

  // --- Draft Handlers (Mark dirty and update local state) ---
  const markDirty = () => {
    setIsDirty(true)
  }

  const updateTopic = (updatedTopic) => {
    setDraftTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t))
    markDirty()
  }
  const deleteTopic = (id) => {
    if (window.confirm('Delete this topic? (Will be finalized on Save)')) {
      setDraftTopics(prev => prev.filter(t => t.id !== id))
      markDirty()
    }
  }
  const addTopic = () => {
    if (!newTopicTitle.trim()) return
    const newT = { 
      id: `temp-${Date.now()}`, 
      meeting_id: meetId,
      title: newTopicTitle.trim(), 
      content: null, 
      category: null, 
      resolved: false,
      sort_order: draftTopics.length 
    }
    setDraftTopics(prev => [...prev, newT])
    setNewTopicTitle('')
    markDirty()
  }

  const updateAction = (updatedAction) => {
    setDraftActions(prev => prev.map(a => a.id === updatedAction.id ? updatedAction : a))
    markDirty()
  }
  const deleteAction = (id) => {
    if (window.confirm('Delete this action item? (Will be finalized on Save)')) {
      setDraftActions(prev => prev.filter(a => a.id !== id))
      markDirty()
    }
  }
  const addAction = () => {
    if (!newActionDesc.trim()) return
    const newA = {
      id: `temp-${Date.now()}`,
      meeting_id: meetId,
      description: newActionDesc.trim(),
      assignee: newActionAssignee.trim() || null,
      status: 'pending',
      due_date: null
    }
    setDraftActions(prev => [...prev, newA])
    setNewActionDesc('')
    setNewActionAssignee('')
    markDirty()
  }

  // --- Save Logic (Batch Sync to API) ---
  const handleSave = async () => {
    if (!meeting) return
    setIsSaving(true)
    try {
      // 1. Save Notes if changed
      if (draftNotes !== (meeting.notes || '')) {
        await fetch(`/api/meetings/${meetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: draftNotes }),
        })
      }

      // 2. Sync Topics
      const originalTopicIds = new Set((meeting.topics || []).map(t => t.id))
      const draftTopicIds = new Set(draftTopics.filter(t => typeof t.id === 'number').map(t => t.id))
      
      // Deletes
      for (const t of meeting.topics || []) {
        if (!draftTopicIds.has(t.id)) {
          await api.topics.delete(t.id)
        }
      }
      
      // Updates & Creates
      for (const t of draftTopics) {
        if (typeof t.id === 'number' && originalTopicIds.has(t.id)) {
          await api.topics.update(t.id, { 
            title: t.title, 
            content: t.content, 
            category: t.category, 
            resolved: t.resolved 
          })
        } else if (typeof t.id === 'string' && t.id.startsWith('temp-')) {
          await api.topics.create(meetId, {
            title: t.title,
            content: t.content,
            category: t.category,
            sort_order: t.sort_order || 0
          })
        }
      }

      // 3. Sync Actions
      const originalActionIds = new Set((meeting.action_items || []).map(a => a.id))
      const draftActionIds = new Set(draftActions.filter(a => typeof a.id === 'number').map(a => a.id))
      
      for (const a of meeting.action_items || []) {
        if (!draftActionIds.has(a.id)) {
          await api.actions.delete(a.id)
        }
      }
      
      for (const a of draftActions) {
        if (typeof a.id === 'number' && originalActionIds.has(a.id)) {
          await api.actions.update(a.id, {
            description: a.description,
            assignee: a.assignee,
            status: a.status,
            due_date: a.due_date
          })
        } else if (typeof a.id === 'string' && a.id.startsWith('temp-')) {
          await api.actions.create(meetId, {
            description: a.description,
            assignee: a.assignee,
            status: a.status || 'pending',
            due_date: a.due_date
          })
        }
      }

      setIsDirty(false)
      setIsSaved(true)
      navigate('/')
    } catch (err) {
      console.error("Save failed", err)
      alert("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // --- Back Logic ---
  const handleBack = async () => {
    if (isStartMode && !isSaved) {
      if (window.confirm('Discard this 1:1 session and all its contents? This cannot be undone.')) {
        try {
          await api.meetings.delete(meetId)
          navigate('/')
        } catch (err) {
          console.error("Failed to delete meeting:", err)
          alert("Failed to discard meeting. Please try again.")
        }
      }
    } else {
      if (isDirty) {
        if (window.confirm('You have unsaved changes. Leave without saving?')) {
          navigate('/')
        }
      } else {
        navigate('/')
      }
    }
  }

  if (!meeting) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>

  const unresolvedTopics = draftTopics.filter(t => !t.resolved)
  const resolvedTopics = draftTopics.filter(t => t.resolved)


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={handleBack} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            1:1 with {meeting.person_name}
            {isStartMode && !isSaved && (
              <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded font-medium">
                UNSAVED DRAFT
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">{new Date(meeting.scheduled_at).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving || !isDirty}
          className={`px-4 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors ${
            isSaving || !isDirty 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save & Return'}
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Notes</label>
        <textarea
          value={draftNotes}
          onChange={(e) => { setDraftNotes(e.target.value); markDirty(); }}
          rows={3}
          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          placeholder="General notes for this 1:1..."
        />
      </div>

      <section>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Topics ({draftTopics.length})
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            value={newTopicTitle}
            onChange={e => setNewTopicTitle(e.target.value)}
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
          {draftTopics.length === 0 && (
            <div className="text-sm text-gray-400 py-6 text-center">No topics yet</div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Action Items ({draftActions.length})
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            value={newActionDesc}
            onChange={e => setNewActionDesc(e.target.value)}
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
          {draftActions.map(a => (
            <ActionRow key={a.id} action={a} onUpdate={updateAction} onDelete={deleteAction} />
          ))}
          {draftActions.length === 0 && (
            <div className="text-sm text-gray-400 py-6 text-center">No action items yet</div>
          )}
        </div>
      </section>
    </div>
  )
}