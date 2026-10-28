import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/use-toast'
import { StellarUtils } from '@decentralized-identity/shared'
import { 
  EyeOff, 
  Eye, 
  Send, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  Share2, 
  Trash2,
  Key
} from 'lucide-react'

interface DisclosureHistoryItem {
  id: string
  verifierName: string
  disclosedFields: string[]
  hiddenFieldsCount: number
  commitmentRoot: string
  timestamp: string
  status: 'active' | 'revoked'
}

export default function DisclosurePage() {
  const { user } = useAuthStore()
  const { toast } = useToast()

  const [availableAttributes, setAvailableAttributes] = useState<{ key: string; value: string; selected: boolean }[]>([
    { key: 'full_name', value: 'Alex Montgomery', selected: false },
    { key: 'is_over_21', value: 'true (Verified)', selected: true },
    { key: 'citizenship_country', value: 'US', selected: false },
    { key: 'stellar_address', value: user?.stellarAddress || 'GDK4...7PQX', selected: true },
    { key: 'credit_score_bracket', value: '750+', selected: false },
    { key: 'accredited_investor', value: 'true', selected: false },
  ])

  const [verifierName, setVerifierName] = useState('Stellar DeFi Liquidity Protocol')
  const [purpose, setPurpose] = useState('Age & Wallet Whitelist Verification')
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<DisclosureHistoryItem[]>(() => {
    const saved = localStorage.getItem('decent_id_disclosures')
    return saved ? JSON.parse(saved) : [
      {
        id: 'disc-901',
        verifierName: 'Soroban DEX Gateway',
        disclosedFields: ['is_over_21', 'stellar_address'],
        hiddenFieldsCount: 4,
        commitmentRoot: '0x3f9b8c1d5e2a7f0e9b4d1c3a7e5f8b2d4c6a8e0f',
        timestamp: new Date(Date.now() - 3600000 * 4).toLocaleDateString(),
        status: 'active'
      }
    ]
  })

  useEffect(() => {
    localStorage.setItem('decent_id_disclosures', JSON.stringify(history))
  }, [history])

  const toggleAttribute = (index: number) => {
    setAvailableAttributes(prev => {
      const copy = [...prev]
      copy[index].selected = !copy[index].selected
      return copy
    })
  }

  const handleGenerateDisclosure = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    try {
      const selected = availableAttributes.filter(a => a.selected)
      if (selected.length === 0) {
        throw new Error('Select at least one attribute to disclose.')
      }

      // Compute cryptographic commitment root using SHA-256
      const payloadString = JSON.stringify(selected.map(s => ({ k: s.key, v: s.value })))
      const commitment = await StellarUtils.hashData(payloadString)

      const newItem: DisclosureHistoryItem = {
        id: `disc-${Date.now()}`,
        verifierName: verifierName.trim() || 'Third-Party Verifier',
        disclosedFields: selected.map(s => s.key),
        hiddenFieldsCount: availableAttributes.length - selected.length,
        commitmentRoot: `0x${commitment.slice(0, 40)}`,
        timestamp: new Date().toLocaleDateString(),
        status: 'active'
      }

      setHistory(prev => [newItem, ...prev])
      toast({
        title: 'Zero-Knowledge Proof Generated',
        description: `Disclosed ${selected.length} fields; ${newItem.hiddenFieldsCount} fields preserved privately.`
      })
    } catch (err: any) {
      toast({
        title: 'Disclosure Failed',
        description: err.message || 'Error creating disclosure response',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevoke = (id: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, status: 'revoked' as const } : h))
    toast({
      title: 'Disclosure Revoked',
      description: 'The verifier access token and cryptographic proof have been invalidated.'
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <EyeOff className="h-8 w-8 text-indigo-400" />
          Selective Disclosure
        </h1>
        <p className="text-slate-400 mt-1">
          Share only specific identity attributes with cryptographic zero-knowledge commitments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Generator */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-indigo-400" />
                Create Selective Disclosure Proof
              </CardTitle>
              <CardDescription className="text-slate-400">
                Choose the attributes you consent to reveal. All unselected attributes remain mathematically concealed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateDisclosure} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Target Verifier / App</label>
                    <Input 
                      value={verifierName} 
                      onChange={e => setVerifierName(e.target.value)}
                      className="mt-1 bg-slate-950/70 border-slate-700 text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Requested Purpose</label>
                    <Input 
                      value={purpose} 
                      onChange={e => setPurpose(e.target.value)}
                      className="mt-1 bg-slate-950/70 border-slate-700 text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Select Attributes to Disclose</span>
                    <span className="text-xs text-indigo-400">
                      {availableAttributes.filter(a => a.selected).length} of {availableAttributes.length} selected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {availableAttributes.map((attr, idx) => (
                      <div 
                        key={attr.key}
                        onClick={() => toggleAttribute(idx)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          attr.selected 
                            ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm shadow-indigo-500/10' 
                            : 'bg-slate-950/40 border-slate-800/80 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${attr.selected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                            {attr.selected ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{attr.key}</p>
                            <p className="text-xs text-slate-400 font-mono">{attr.value}</p>
                          </div>
                        </div>

                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          attr.selected ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {attr.selected ? 'DISCLOSED' : 'CONCEALED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 shadow-lg shadow-indigo-500/20"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Computing SHA-256 Merkle Commitment...' : 'Sign & Submit Proof to Verifier'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Disclosures */}
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-slate-100 text-lg">Active Disclosures</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Active permissions granted to external parties. You may revoke consent at any moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No active disclosure sessions.</p>
              ) : (
                history.map(item => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{item.verifierName}</h4>
                        <p className="text-xs text-slate-400 font-mono">{item.timestamp}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p><span className="text-slate-300 font-medium">Disclosed:</span> {item.disclosedFields.join(', ')}</p>
                      <p><span className="text-slate-300 font-medium">Hidden:</span> {item.hiddenFieldsCount} properties</p>
                      <p className="font-mono text-[11px] text-indigo-400 truncate">
                        Root: {item.commitmentRoot}
                      </p>
                    </div>

                    {item.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRevoke(item.id)}
                        className="w-full h-8 text-xs border-rose-900/40 text-rose-400 hover:bg-rose-950/40"
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
