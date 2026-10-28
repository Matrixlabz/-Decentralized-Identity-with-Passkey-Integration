import React from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Key, 
  Fingerprint, 
  Globe, 
  EyeOff, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Cpu,
  Layers
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-24 py-8 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-8 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-6 backdrop-blur-md">
          <Fingerprint className="h-4 w-4" />
          Stellar Soroban • Passkey (Secp256r1) Standard
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Decentralized Identity Built on{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
            Biometric Hardware
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Zero-seed-phrase identity vaults anchored to Stellar Soroban smart contracts. 
          Sign on-chain transactions and prove verifiable credentials using Face ID, Touch ID, or Windows Hello.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-base shadow-xl shadow-indigo-500/25 rounded-xl">
            <Link to="/register">
              Create Passkey Identity <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="border-slate-800 text-slate-300 hover:bg-slate-900 px-8 py-6 text-base rounded-xl">
            <Link to="/login">Sign In with Passkey</Link>
          </Button>
        </div>

        {/* Metric Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-bold text-slate-100 font-mono">Secp256r1</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">WebAuthn Standard</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-bold text-emerald-400 font-mono">&lt; 3.5s</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Soroban Finality</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-bold text-indigo-400 font-mono">W3C DID</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">v1.0 Compliant</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-bold text-sky-400 font-mono">AES-256-GCM</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Encrypted Vault</p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100">
            Engineered for Privacy, Speed, and Compliance
          </h2>
          <p className="text-slate-400 mt-3">
            Every layer from Soroban smart contracts to frontend cryptographic utilities is built without proprietary lock-in.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Key className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Seedless Hardware Passkeys</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Eliminate seed phrases and insecure passwords. Your cryptographic keys stay in your device's Secure Enclave, signing transactions via WebAuthn.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <EyeOff className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Selective Disclosure</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify conditions (e.g. "Over 21" or "Accredited Investor") using SHA-256 Merkle root commitments without exposing private personal identifiers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Soroban Smart Contracts</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Rust WASM contracts manage DID registry bindings, credential verification statuses, and decentralized disclosure requests with near-zero gas costs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">W3C DID Compatibility</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generates compliant `did:passkey` documents containing verification methods, service endpoints, and cryptographic public keys ready for cross-chain interoperability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Client-Side Vault Encryption</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Identity claims and confidential attributes are encrypted locally with AES-256-GCM. The backend only ever receives cryptographic hashes and ciphertext.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Instant Testnet Funder</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Built-in Stellar Friendbot integration automatically creates and funds your on-chain account with testnet XLM for seamless deployment and testing.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-blue-950/70 border border-indigo-500/30 p-10 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            Take Control of Your Sovereign Identity Today
          </h2>
          <p className="text-slate-300">
            Join the future of verifiable, hardware-authenticated credentials on Stellar.
          </p>
          <div className="pt-4 flex justify-center">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-indigo-500/25">
              <Link to="/register">Create Your Identity Vault</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
