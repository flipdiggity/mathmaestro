'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink } from 'lucide-react';

interface UsageData {
  generates: number;
  grades: number;
  freeGeneratesRemaining: number;
  freeGradesRemaining: number;
  hasPaymentMethod: boolean;
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/usage')
      .then((r) => r.json())
      .then(setUsage)
      .finally(() => setLoading(false));
  }, []);

  async function handleAddPayment() {
    const res = await fetch('/api/billing/checkout', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  async function handleManageBilling() {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
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
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Billing & Usage</h1>

        {/* Usage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Worksheets Generated</CardTitle>
              <CardDescription>$0.50 per worksheet after free tier</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{usage?.generates ?? 0}</p>
              {(usage?.freeGeneratesRemaining ?? 0) > 0 ? (
                <p className="text-sm text-green-600 mt-1">
                  {usage?.freeGeneratesRemaining} free remaining
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-1">Free tier used</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Worksheets Graded</CardTitle>
              <CardDescription>$0.75 per grading after free tier</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{usage?.grades ?? 0}</p>
              {(usage?.freeGradesRemaining ?? 0) > 0 ? (
                <p className="text-sm text-green-600 mt-1">
                  {usage?.freeGradesRemaining} free remaining
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-1">Free tier used</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Payment Method</CardTitle>
                <CardDescription>
                  Required after free tier (5 generates + 5 grades)
                </CardDescription>
              </div>
              {usage?.hasPaymentMethod ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              ) : (
                <Badge variant="outline">Not set up</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {usage?.hasPaymentMethod ? (
              <Button variant="outline" size="sm" onClick={handleManageBilling}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage in Stripe
              </Button>
            ) : (
              <Button size="sm" onClick={handleAddPayment}>
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Free tier</span>
              <span className="font-medium text-slate-900">5 generates + 5 grades</span>
            </div>
            <div className="flex justify-between">
              <span>Worksheet generation</span>
              <span className="font-medium text-slate-900">$0.50 each</span>
            </div>
            <div className="flex justify-between">
              <span>AI grading</span>
              <span className="font-medium text-slate-900">$0.75 each</span>
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              You&apos;re only charged for what you use. No subscriptions, no commitments.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
