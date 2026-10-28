import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  ShieldCheck,
  Key,
  FileText,
  Eye,
  CheckCircle2,
  Coins,
  ArrowUpRight,
  Fingerprint,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [balance, setBalance] = useState<string>('0');
  const [isFunding, setIsFunding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAccountData = async () => {
    if (!user?.stellarAddress) return;
    try {
      setIsRefreshing(true);
      // Fetch identity info
      const idRes = await fetch(`/api/identity/${user.id}`);
      if (idRes.ok) {
        const idData = await idRes.json();
        if (idData.data) setUser(idData.data);
      }

      // Fetch on-chain account info
      const accRes = await fetch(`/api/stellar/account/${user.stellarAddress}`);
      if (accRes.ok) {
        const accData = await accRes.json();
        const nativeBal = accData.data?.balances?.find((b: any) => b.asset_type === 'native');
        if (nativeBal) {
          setBalance(parseFloat(nativeBal.balance).toLocaleString());
        }
      }
    } catch (err) {
      console.error('Error fetching account data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [user?.stellarAddress]);

  const handleFundAccount = async () => {
    if (!user?.stellarAddress) return;
    try {
      setIsFunding(true);
      const res = await fetch('/api/stellar/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: user.stellarAddress }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Faucet Funded',
          description: 'Successfully received 10,000 Testnet XLM from Friendbot.',
          type: 'success',
        });
        await fetchAccountData();
      } else {
        throw new Error(data.message || 'Funding failed');
      }
    } catch (err: any) {
      toast({
        title: 'Funding Error',
        description: err.message,
        type: 'error',
      });
    } finally {
      setIsFunding(false);
    }
  };

  const attributesCount = user?.attributes?.length || 0;
  const verifiedCount = user?.attributes?.filter((a) => a.verified)?.length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-medium text-cyan-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Decentralized Identity Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.displayName || 'Identity Holder'}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-mono break-all">
              {user?.id || 'did:stellar:anonymous'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAccountData}
              disabled={isRefreshing}
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleFundAccount}
              disabled={isFunding}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
            >
              <Coins className="h-4 w-4 mr-1.5" />
              {isFunding ? 'Funding XLM...' : 'Request 10,000 XLM Faucet'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Testnet Balance</p>
            <p className="text-2xl font-bold text-white mt-1">{balance} XLM</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Claims</p>
            <p className="text-2xl font-bold text-white mt-1">{attributesCount}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Verified Attestations</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{verifiedCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Passkey Security</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">Secp256r1</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Fingerprint className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* On-Chain Verification Card */}
        <div className="lg:col-span-2 p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-cyan-400" />
              On-Chain Soroban Identity Registry
            </h2>
            <Link to="/identity" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View DID Document <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="text-slate-400 text-[11px] mb-1">BOUND STELLAR ADDRESS</div>
              <div className="text-slate-200 break-all select-all">{user?.stellarAddress || 'Not initialized'}</div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="text-slate-400 text-[11px] mb-1">PASSKEY CREDENTIAL PUBLIC KEY</div>
              <div className="text-cyan-300 break-all select-all">{user?.publicKey || 'Hardware Authenticator Bound'}</div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/attributes">
              <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-slate-200">
                <FileText className="h-4 w-4 mr-1.5" />
                Manage Attributes
              </Button>
            </Link>
            <Link to="/disclosure">
              <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30">
                <Eye className="h-4 w-4 mr-1.5" />
                Selective Disclosure Portal
              </Button>
            </Link>
          </div>
        </div>

        {/* Protocol Security Card */}
        <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Cryptographic Guarantees
            </h2>
            <ul className="text-xs text-slate-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                <span><strong>No Passkey Extraction:</strong> Private keys never leave the secure enclave/TPM.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                <span><strong>AES-256-GCM Storage:</strong> Personal attributes are encrypted before persistence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                <span><strong>Zero-Knowledge Commitments:</strong> Selective disclosure shares cryptographic roots without cleartext leaks.</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              Smart Contract: IdentityRegistry.wasm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
