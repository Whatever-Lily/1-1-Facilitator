import { useEffect, useState } from 'react'
import { api } from '../api'
import { User, Trash2 } from 'lucide-react'

export default function PeoplePage() {
  const [people, setPeople] = useState([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  const load = () => api.people.list().then(setPeople)
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    await api.people.create({ name, role: role || null })
    setName(''); setRole('')
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this person and all their meetings?')) return
    await api.people.delete(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage the people you have 1:1s with</p>
      </div>

      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} required
          placeholder="Name" className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md" />
        <input value={role} onChange={e => setRole(e.target.value)}
          placeholder="Role" className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md" />
        <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">Add</button>
      </form>

      <div className="space-y-2">
        {people.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={14} className="text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                {p.role && <div className="text-xs text-gray-500">{p.role}</div>}
              </div>
            </div>
            <button onClick={() => remove(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
