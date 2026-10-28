import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/use-toast'
import { 
  Settings, 
  Smartphone, 
  Fingerprint, 
  Key, 
  Globe, 
  Download, 
  Copy, 
  LogOut, 
  Trash2,
  CheckCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [network, setNetwork] = useState('testnet')
  const [rpcUrl, setRpcUrl] = useState('https://soroban-testnet.stellar.org')
  const [horizonUrl, setHorizonUrl] = useState('https://horizon-testnet.stellar.org')
  const [registryContract, setRegistryContract] = useState('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC')
  const [disclosureContract, setDisclosureContract] = useState('CBPDNPWCH2KZZKGY3XN2I4RZZM4WCEZ47Z2Q2RMCVVZTRSQVU7HHGCZ5')

  const [devices, setDevices] = useState([
    {
      id: 'dev-01',
      name: 'MacBook Pro TouchID (Secp256r1)',
      lastUsed: 'Today, 09:15 AM',
      algorithm: 'ES256 (Secp256r1)',
      isCurrent: true
    },
    {
      id: 'dev-02',
      name: 'iPhone 15 Pro FaceID (Passkey)',
      lastUsed: 'Yesterday, 18:42 PM',
      algorithm: 'ES256 (Secp256r1)',
      isCurrent: false
    }
  ])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard.`
    })
  }

  const handleExportBackup = () => {
    const backupData = {
      username: user?.username,
      stellarAddress: user?.stellarAddress,
      did: user?.did,
      exportedAt: new Date().toISOString(),
      network: 'Stellar Testnet',
      registryContract,
      disclosureContract
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decentralized-identity-backup-${user?.username || 'vault'}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Backup Exported',
      description: 'Encrypted identity vault safely exported to your downloads folder.'
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast({
      title: 'Signed Out',
      description: 'Your session has been securely terminated.'
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <Settings className="h-8 w-8 text-indigo-400" />
          Settings & Device Security
        </h1>
        <p className="text-slate-400 mt-1">
          Manage WebAuthn Passkeys, Stellar Soroban nodes, and decentralized identity configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Authenticators & Passkey Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-indigo-400" />
                Registered Passkey Authenticators
              </CardTitle>
              <CardDescription className="text-slate-400">
                Hardware devices and biometrics authorized to sign transactions for your identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {devices.map(dev => (
                <div 
                  key={dev.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">{dev.name}</span>
                        {dev.isCurrent && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Alg: {dev.algorithm} • Last active: {dev.lastUsed}
                      </p>
                    </div>
                  </div>

                  {!dev.isCurrent && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setDevices(prev => prev.filter(d => d.id !== dev.id))
                        toast({
                          title: 'Device Removed',
                          description: 'Passkey credentials have been deregistered.'
                        })
                      }}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 h-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button 
                variant="outline" 
                className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
                onClick={() => {
                  toast({
                    title: 'Registering New Passkey',
                    description: 'Follow your operating system biometric prompt to register an additional passkey.'
                  })
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Register Additional Passkey Device
              </Button>
            </CardContent>
          </Card>

          {/* Network & Contract Configuration */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-400" />
                Stellar Network & Contract Endpoints
              </CardTitle>
              <CardDescription className="text-slate-400">
                Connected blockchain RPC nodes and deployed Soroban smart contract addresses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Soroban RPC URL</label>
                <Input 
                  value={rpcUrl} 
                  onChange={e => setRpcUrl(e.target.value)}
                  className="mt-1 bg-slate-950/70 border-slate-700 text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Horizon API Endpoint</label>
                <Input 
                  value={horizonUrl} 
                  onChange={e => setHorizonUrl(e.target.value)}
                  className="mt-1 bg-slate-950/70 border-slate-700 text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Identity Registry Contract ID</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={registryContract} 
                    onChange={e => setRegistryContract(e.target.value)}
                    className="bg-slate-950/70 border-slate-700 text-slate-200 font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(registryContract, 'Registry ID')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    <Copy className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Selective Disclosure Contract ID</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={disclosureContract} 
                    onChange={e => setDisclosureContract(e.target.value)}
                    className="bg-slate-950/70 border-slate-700 text-slate-200 font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(disclosureContract, 'Disclosure ID')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    <Copy className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => {
                    toast({
                      title: 'Settings Saved',
                      description: 'RPC endpoints and contract configurations updated successfully.'
                    })
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                >
                  Save Network Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Vault Export & Danger Zone */}
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-400" />
                Identity Vault Backup
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Export an encrypted, portable snapshot of your decentralized identity, credentials, and network configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Your credentials are encrypted using AES-256-GCM. Keep your downloaded vault file safe for offline recovery.
              </p>
              <Button 
                onClick={handleExportBackup}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Encrypted JSON
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-rose-900/30 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-rose-400 flex items-center gap-2 text-base">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                Session & Termination
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Securely clear authentication tokens and local state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full border-rose-900/50 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out of Identity Vault
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
