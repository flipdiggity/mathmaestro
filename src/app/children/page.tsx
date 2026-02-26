'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  grade: number;
  track: string;
  state: string;
  district: string;
  targetTestDate: string | null;
}

const AVAILABLE_STATES = [{ code: 'TX', name: 'Texas' }];
const AVAILABLE_DISTRICTS: Record<string, { id: string; name: string }[]> = {
  TX: [{ id: 'eanes-isd', name: 'Eanes ISD' }],
};
const GRADES = [3, 4, 5, 6, 7];
const TRACKS = ['standard', 'accelerated'];

export default function ManageChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(3);
  const [track, setTrack] = useState('standard');
  const [state, setState] = useState('TX');
  const [district, setDistrict] = useState('eanes-isd');
  const [targetTestDate, setTargetTestDate] = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    const res = await fetch('/api/children');
    if (res.ok) {
      const data = await res.json();
      setChildren(data.children);
    }
    setLoading(false);
  }

  function resetForm() {
    setName('');
    setGrade(3);
    setTrack('standard');
    setState('TX');
    setDistrict('eanes-isd');
    setTargetTestDate('');
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(child: Child) {
    setName(child.name);
    setGrade(child.grade);
    setTrack(child.track);
    setState(child.state);
    setDistrict(child.district);
    setTargetTestDate(child.targetTestDate ? child.targetTestDate.split('T')[0] : '');
    setEditingId(child.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      name,
      grade,
      track,
      state,
      district,
      targetTestDate: targetTestDate || null,
    };

    if (editingId) {
      await fetch(`/api/children/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    resetForm();
    fetchChildren();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this child? This cannot be undone.')) return;
    await fetch(`/api/children/${id}`, { method: 'DELETE' });
    fetchChildren();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Manage Children</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Child
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? 'Edit Child' : 'Add a Child'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Child's name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        const districts = AVAILABLE_DISTRICTS[e.target.value];
                        if (districts?.length) setDistrict(districts[0].id);
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {AVAILABLE_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {(AVAILABLE_DISTRICTS[state] || []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Track</label>
                    <select
                      value={track}
                      onChange={(e) => setTrack(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {TRACKS.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Target Test Date (optional)
                  </label>
                  <input
                    type="date"
                    value={targetTestDate}
                    onChange={(e) => setTargetTestDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    {editingId ? 'Save Changes' : 'Add Child'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {children.length === 0 && !showForm && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">
              No children added yet. Add your first child to start generating worksheets.
            </p>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Child
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {children.map((child) => (
            <Card key={child.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{child.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Grade {child.grade}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {child.track.charAt(0).toUpperCase() + child.track.slice(1)}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {child.district === 'eanes-isd' ? 'Eanes ISD' : child.district} &middot; {child.state}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(child)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(child.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
