'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface StoreOption {
  code: string;
  name: string;
}

const PRODUCT_FIELDS = [
  { key: 'paan_l', label: 'Paan (L)' },
  { key: 'thandai_l', label: 'Thandai (L)' },
  { key: 'gilori_l', label: 'Gilori (L)' },
  { key: 'paan_s', label: 'Paan (S)' },
  { key: 'thandai_s', label: 'Thandai (S)' },
  { key: 'gilori_s', label: 'Gilori (S)' },
  { key: 'heritage_box_9', label: 'Heritage Box (Set of 9)' },
  { key: 'heritage_box_15', label: 'Heritage Box (Set of 15)' },
] as const;

const FINANCIAL_FIELDS = [
  { key: 'sale_value', label: 'Sale Value' },
  { key: 'collection_received', label: 'Collection Received' },
  { key: 'sample_given', label: 'Sample Given' },
] as const;

const PROMO_FIELDS = [
  { key: 'num_tso', label: 'No. of TSOs' },
  { key: 'promotion_duration', label: 'Promotion Duration (hrs)' },
  { key: 'sample_consumed', label: 'Sample Consumed' },
] as const;

type FieldKey =
  | (typeof PRODUCT_FIELDS)[number]['key']
  | (typeof FINANCIAL_FIELDS)[number]['key']
  | (typeof PROMO_FIELDS)[number]['key'];

function getToday(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function SalesEntryPage() {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storeCode, setStoreCode] = useState('');
  const [date, setDate] = useState(getToday);
  const [values, setValues] = useState<Record<FieldKey, number>>(() => {
    const init: Record<string, number> = {};
    for (const f of [...PRODUCT_FIELDS, ...FINANCIAL_FIELDS, ...PROMO_FIELDS]) {
      init[f.key] = 0;
    }
    return init as Record<FieldKey, number>;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stores')
      .then(r => r.json())
      .then(d => {
        if (d.success) setStores(d.data);
      });
  }, []);

  const handleChange = (key: FieldKey, raw: string) => {
    setValues(prev => ({ ...prev, [key]: Number(raw) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeCode) {
      setError('Please select a store');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_code: storeCode, date, ...values }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        // Reset form
        setStoreCode('');
        setDate(getToday());
        setValues(prev => {
          const reset = { ...prev };
          for (const k of Object.keys(reset) as FieldKey[]) reset[k] = 0;
          return reset;
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to submit');
      }
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-12">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Daily Sales Entry</h1>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Sales entry submitted successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store & Date */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-4 space-y-4">
          <div>
            <label htmlFor="store" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Store
            </label>
            <select
              id="store"
              value={storeCode}
              onChange={e => setStoreCode(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
            >
              <option value="">Select a store</option>
              {stores.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Product Quantities */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Product Quantities</h2>
          <div className="grid grid-cols-2 gap-3">
            {PRODUCT_FIELDS.map(f => (
              <div key={f.key}>
                <label htmlFor={f.key} className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {f.label}
                </label>
                <input
                  id={f.key}
                  type="number"
                  min="0"
                  value={values[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Financial */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Financial</h2>
          <div className="space-y-3">
            {FINANCIAL_FIELDS.map(f => (
              <div key={f.key}>
                <label htmlFor={f.key} className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {f.label}
                </label>
                <input
                  id={f.key}
                  type="number"
                  min="0"
                  step="0.01"
                  value={values[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Promotion */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Promotion</h2>
          <div className="space-y-3">
            {PROMO_FIELDS.map(f => (
              <div key={f.key}>
                <label htmlFor={f.key} className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {f.label}
                </label>
                <input
                  id={f.key}
                  type="number"
                  min="0"
                  value={values[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full px-3 py-2 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-olive hover:bg-brand-gold text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Sales Entry'
          )}
        </button>
      </form>
    </div>
  );
}
