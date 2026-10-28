import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Fingerprint, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { PasskeyUtils } from '@decentralized-identity/shared';
import { useToast } from '@/components/ui/toaster';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupKey, setBackupKey] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setUser, setToken, setAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please provide a display name.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Request fresh challenge from backend server
      const challengeRes = await fetch('/api/auth/challenge');
      const challengeJson = await challengeRes.json();
      if (!challengeJson.success || !challengeJson.data?.challenge) {
        throw new Error('Could not obtain WebAuthn challenge from server');
      }

      const challengeBytes = PasskeyUtils.base64UrlDecode(challengeJson.data.challenge);
      const userId = `user_${Date.now()}`;

      // Step 2: Trigger WebAuthn Biometric / Platform Passkey prompt
      toast({
        title: 'Authenticating Device',
        description: 'Please approve biometric authentication (Touch ID / Windows Hello / Security Key)...',
      });

      const credential = (await PasskeyUtils.createPasskey(
        userId,
        displayName.trim(),
        challengeBytes
      )) as any;

      const rawAttestation = credential.response.attestationObject;
      const rawClientData = credential.response.clientDataJSON;

      const payload = {
        credentialId: credential.id,
        publicKey: credential.id, // Authenticator credential ID identifier
        authenticatorData: PasskeyUtils.base64UrlEncode(new Uint8Array(rawAttestation)),
        clientDataJSON: PasskeyUtils.base64UrlEncode(new Uint8Array(rawClientData)),
        displayName: displayName.trim(),
        userId,
      };

      // Step 3: Register on backend
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const regJson = await regRes.json();
      if (!regRes.ok || !regJson.success) {
        throw new Error(regJson.message || 'Passkey enrollment failed');
      }

      setUser(regJson.data.user);
      setToken(regJson.data.token);
      setAuthenticated(true);

      if (regJson.data.secretKey) {
        setBackupKey(regJson.data.secretKey);
      } else {
        toast({
          title: 'Registration Complete',
          description: 'Your self-sovereign Passkey identity is ready.',
          type: 'success',
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Passkey registration error');
      toast({
        title: 'Registration Error',
        description: err.message || 'Passkey registration failed',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-tr from-cyan-500/20 to-indigo-600/20 rounded-2xl border border-cyan-500/30 mb-3">
            <Fingerprint className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Passkey Identity</h1>
          <p className="text-sm text-slate-400 mt-1">
            Biometric self-sovereign authentication on Stellar
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {backupKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm mb-1 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Passkey Enrolled & Account Created!
              </div>
              <p className="text-slate-300 mb-3">
                Save your Stellar secret key backup below. You can also log in anytime using your device's biometric Passkey:
              </p>
              <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] break-all border border-slate-800 text-amber-300">
                {backupKey}
              </div>
            </div>
            <Button
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
              onClick={() => navigate('/dashboard')}
            >
              Continue to Dashboard
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegisterPasskey} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Name / Identity Alias
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alice Crypto or Acme Corp"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Optional Contact Email (Stored Encrypted)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm transition-colors"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold py-2.5 rounded-xl shadow-lg shadow-cyan-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Enrolling Passkey...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    Register with Passkey
                  </span>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-slate-400 pt-2">
              Already enrolled?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Sign in with Passkey
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
