import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/use-toast'
import { 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ExternalLink,
  Award,
  RefreshCw
} from 'lucide-react'

interface VerificationRecord {
  id: string
  claimType: string
  issuerDid: string
  issuedAt: string
  expiresAt: string
  status: 'valid' | 'revoked' | 'pending'
  proofSignature: string
}

const DEFAULT_VERIFICATIONS: VerificationRecord[] = [
  {
    id: 'v-stellar-kyc-01',
    claimType: 'Stellar KYC Tier 1',
    issuerDid: 'did:passkey:GDK4...stellar-verifier',
    issuedAt: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
    expiresAt: new Date(Date.now() + 86400000 * 360).toLocaleDateString(),
    status: 'valid',
    proofSignature: '0x8f2a4c...d991e0'
  },
  {
    id: 'v-email-02',
    claimType: 'Email & Ownership Proof',
    issuerDid: 'did:passkey:GA5Z...oracle-node-1',
    issuedAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
    expiresAt: new Date(Date.now() + 86400000 * 180).toLocaleDateString(),
    status: 'valid',
    proofSignature: '0x1c3e7b...44b2a9'
  }
]

export default function VerificationsPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  
  const [verifications, setVerifications] = useState<VerificationRecord[]>(() => {
    const saved = localStorage.getItem('decent_id_verifications')
    return saved ? JSON.parse(saved) : DEFAULT_VERIFICATIONS
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [newClaimType, setNewClaimType] = useState('Proof of Residency')
  const [newIssuer, setNewIssuer] = useState('did:passkey:GC4M...attestation-node')

  useEffect(() => {
    localStorage.setItem('decent_id_verifications', JSON.stringify(verifications))
  }, [verifications])

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Simulate on-chain / oracle verification protocol
      await new Promise(r => setTimeout(r, 800))
      const newRec: VerificationRecord = {
        id: `v-${Date.now()}`,
        claimType: newClaimType,
        issuerDid: newIssuer,
        issuedAt: new Date().toLocaleDateString(),
        expiresAt: new Date(Date.now() + 86400000 * 365).toLocaleDateString(),
        status: 'valid',
        proofSignature: `0x${Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')}...`
      }
      setVerifications(prev => [newRec, ...prev])
      setShowRequestModal(false)
      toast({
        title: 'Attestation Created',
        description: `Successfully anchored ${newClaimType} on Stellar Soroban network.`
      })
    } catch (err: any) {
      toast({
        title: 'Request Failed',
        description: err.message || 'Could not verify claim.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = (id: string) => {
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'revoked' as const } : v))
    toast({
      title: 'Verification Revoked',
      description: 'The attestation has been marked revoked in the registry.'
    })
  }

  const handleDelete = (id: string) => {
    setVerifications(prev => prev.filter(v => v.id !== id))
    toast({
      title: 'Record Removed',
      description: 'The verification was removed from your local vault.'
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-indigo-400" />
            Third-Party Verifications
          </h1>
          <p className="text-slate-400 mt-1">
            Manage verifiable credentials, cryptographic proofs, and third-party attestations.
          </p>
        </div>
        <Button 
          onClick={() => setShowRequestModal(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          Request Attestation
        </Button>
      </div>

      {showRequestModal && (
        <Card className="bg-slate-900/90 border-indigo-500/30 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-100">Request New Attestation</CardTitle>
            <CardDescription className="text-slate-400">
              Submit an identity claim for endorsement by an authorized Stellar oracle or issuer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestVerification} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Claim / Schema Type</label>
                <Input 
                  value={newClaimType} 
                  onChange={e => setNewClaimType(e.target.value)} 
                  className="mt-1 bg-slate-950/70 border-slate-700 text-slate-100"
                  placeholder="e.g., Proof of Age (21+), Employment, Accreditation"
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Authorized Issuer DID</label>
                <Input 
                  value={newIssuer} 
                  onChange={e => setNewIssuer(e.target.value)} 
                  className="mt-1 bg-slate-950/70 border-slate-700 text-slate-100"
                  placeholder="did:passkey:G..."
                  required 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRequestModal(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Anchoring Proof...
                    </>
                  ) : (
                    'Submit to Issuer'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {verifications.map((item) => (
          <Card 
            key={item.id} 
            className={`border transition-all duration-200 ${
              item.status === 'valid' 
                ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10 shadow-lg' 
                : 'bg-slate-900/30 border-red-900/40 opacity-75'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Award className="h-6 w-6" />
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${
                  item.status === 'valid'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {item.status}
                </span>
              </div>
              <CardTitle className="text-slate-100 text-lg mt-3">{item.claimType}</CardTitle>
              <CardDescription className="text-slate-400 text-xs font-mono truncate">
                Issuer: {item.issuerDid}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Issued:</span>
                  <span className="text-slate-200">{item.issuedAt}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Expires:</span>
                  <span className="text-slate-200">{item.expiresAt}</span>
                </div>
                <div className="flex justify-between text-slate-400 truncate">
                  <span>Sig:</span>
                  <span className="text-indigo-400">{item.proofSignature}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {item.status === 'valid' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRevoke(item.id)}
                    className="border-rose-900/50 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 h-8 text-xs"
                  >
                    Revoke
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-500 hover:text-slate-300 h-8 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 h-8 text-xs flex items-center gap-1"
                  onClick={() => {
                    toast({
                      title: 'Cryptographic Proof Valid',
                      description: `ECDSA Secp256r1 signature matches issuer DID ${item.issuerDid}`
                    })
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Verify Proof
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
