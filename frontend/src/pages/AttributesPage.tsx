import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { FileText, Plus, ShieldCheck, Lock, Unlock, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { AttributeType, IdentityAttribute } from '@decentralized-identity/shared';

export default function AttributesPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [attrName, setAttrName] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [attrType, setAttrType] = useState<AttributeType>(AttributeType.EMAIL);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName || !attrValue) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/identity/${user?.id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: attrName,
          value: attrValue,
          type: attrType,
          encrypted: isEncrypted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add attribute');
      }

      setUser(data.data);
      toast({
        title: 'Attribute Claim Recorded',
        description: `Added "${attrName}" to your decentralized identity.`,
        type: 'success',
      });

      setAttrName('');
      setAttrValue('');
      setIsAdding(false);
    } catch (err: any) {
      toast({
        title: 'Error Adding Attribute',
        description: err.message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const attributes: IdentityAttribute[] = user?.attributes || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-cyan-400" />
            Identity Attribute Claims
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Self-sovereign credential claims secured with client-side AES-256-GCM encryption
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          size="sm"
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {isAdding ? 'Cancel' : 'Add New Attribute'}
        </Button>
      </div>

      {/* Add Attribute Drawer / Card */}
      {isAdding && (
        <form onSubmit={handleAddAttribute} className="p-6 bg-slate-900 border border-cyan-500/30 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
            Create New Attribute Claim
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Attribute Name</label>
              <input
                type="text"
                placeholder="e.g. Email, Full Name, Passport Number"
                value={attrName}
                onChange={(e) => setAttrName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Attribute Type</label>
              <select
                value={attrType}
                onChange={(e) => setAttrType(e.target.value as AttributeType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value={AttributeType.EMAIL}>Email</option>
                <option value={AttributeType.NAME}>Name</option>
                <option value={AttributeType.PHONE}>Phone</option>
                <option value={AttributeType.DATE_OF_BIRTH}>Date of Birth</option>
                <option value={AttributeType.GOVERNMENT_ID}>Government ID</option>
                <option value={AttributeType.ADDRESS}>Address</option>
                <option value={AttributeType.EMPLOYMENT}>Employment</option>
                <option value={AttributeType.CUSTOM}>Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Claim Value</label>
              <input
                type="text"
                placeholder="Value..."
                value={attrValue}
                onChange={(e) => setAttrValue(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Encrypt with AES-256-GCM before on-chain publishing</span>
            </label>

            <Button
              type="submit"
              disabled={isLoading}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
            >
              {isLoading ? 'Saving...' : 'Save Attribute'}
            </Button>
          </div>
        </form>
      )}

      {/* Attributes List */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {attributes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileText className="h-10 w-10 mx-auto text-slate-600" />
            <p className="text-sm">No attribute claims registered yet.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Add First Attribute
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {attributes.map((attr) => (
              <div key={attr.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{attr.name}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-[10px] rounded-full uppercase tracking-wider text-slate-400 font-mono">
                      {attr.type}
                    </span>
                    {attr.encrypted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                        <Lock className="h-3 w-3" /> Encrypted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Unlock className="h-3 w-3" /> Cleartext
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-400 break-all">{attr.value}</div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {attr.verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-700/60 rounded-full text-xs font-medium text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified Claim
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-700/60 rounded-full text-xs font-medium text-amber-300">
                      <Clock className="h-3.5 w-3.5" />
                      Self-Asserted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
