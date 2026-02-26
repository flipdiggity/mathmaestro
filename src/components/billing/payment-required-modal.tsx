'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, X } from 'lucide-react';

interface PaymentRequiredModalProps {
  message: string;
  onClose: () => void;
}

export function PaymentRequiredModal({ message, onClose }: PaymentRequiredModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleAddPayment() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle className="text-lg">Payment Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{message}</p>

          <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Worksheet generation</span>
              <span className="font-medium">$0.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">AI grading</span>
              <span className="font-medium">$0.75</span>
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t">
              Pay only for what you use. No subscriptions.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleAddPayment}
              disabled={loading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {loading ? 'Redirecting...' : 'Add Payment Method'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
