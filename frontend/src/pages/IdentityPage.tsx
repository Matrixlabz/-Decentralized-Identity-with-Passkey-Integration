import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Shield, Key, Copy, Check, FileCode, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

export default function IdentityPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const didDocument = user?.didDocument || {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: user?.id || `did:stellar:${user?.stellarAddress || 'G...' }`,
    verificationMethod: [
      {
        id: `${user?.id || 'did:stellar:user'}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: user?.id || 'did:stellar:user',
        publicKeyMultibase: user?.publicKey || 'z6Mku...',
      },
    ],
    authentication: [`${user?.id || 'did:stellar:user'}#key-1`],
    assertionMethod: [`${user?.id || 'did:stellar:user'}#key-1`],
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast({
      title: 'Copied to Clipboard',
      description: `${label} copied.`,
      type: 'default',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadDID = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(didDocument, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${user?.id || 'did'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast({
      title: 'DID Document Exported',
      description: 'Saved DID Document JSON to downloads.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            Decentralized Identifier (DID)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            W3C DID v1.0 standard representation of your on-chain self-sovereign identity
          </p>
        </div>

        <Button
          onClick={handleDownloadDID}
          size="sm"
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold self-start sm:self-auto"
        >
          <Download className="h-4 w-4 mr-1.5" />
          Export DID JSON
        </Button>
      </div>

      {/* DID Attributes Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">DID URI Identifier</span>
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 break-all">
            <span>{didDocument.id}</span>
            <button
              onClick={() => handleCopy(didDocument.id, 'DID URI')}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white shrink-0"
            >
              {copiedKey === 'DID URI' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Bound Stellar Account</span>
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 break-all">
            <span>{user?.stellarAddress || 'Pending deployment'}</span>
            <button
              onClick={() => handleCopy(user?.stellarAddress || '', 'Stellar Address')}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white shrink-0"
            >
              {copiedKey === 'Stellar Address' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* JSON Viewer Card */}
      <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileCode className="h-4 w-4 text-cyan-400" />
            W3C DID Document Spec (JSON-LD)
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(JSON.stringify(didDocument, null, 2), 'DID Document JSON')}
            className="text-xs text-slate-400 hover:text-white"
          >
            {copiedKey === 'DID Document JSON' ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            Copy JSON
          </Button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-96">
          {JSON.stringify(didDocument, null, 2)}
        </pre>
      </div>
    </div>
  );
}
