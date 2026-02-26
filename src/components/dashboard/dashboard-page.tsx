'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChildCard, ChildData } from '@/components/dashboard/child-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function DashboardPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChildren() {
      try {
        const res = await fetch('/api/children');
        if (!res.ok) throw new Error('Failed to fetch children');
        const data = await res.json();
        setChildren(data.children);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchChildren();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Math practice for your kids</p>
            <p className="text-sm text-slate-400 mt-1">{today}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/children">
              <Plus className="h-4 w-4 mr-1" /> Manage Children
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-500 text-sm">Loading...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && children.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">
              No children found. Add a child to get started.
            </p>
            <Button asChild size="sm">
              <Link href="/children">
                <Plus className="h-4 w-4 mr-1" /> Add a Child
              </Link>
            </Button>
          </div>
        )}

        {!loading && !error && children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
