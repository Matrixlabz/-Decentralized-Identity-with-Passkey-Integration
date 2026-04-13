import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Shield, Key, Fingerprint, Globe } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Decentralized Identity
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Self-sovereign identity platform using Stellar's Secp256r1 passkey support. 
            Take control of your digital identity with biometric authentication.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/register">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Key className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Passkey Authentication</h3>
            <p className="text-gray-600">
              Secure biometric authentication using device passkeys with Secp256r1 support
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Fingerprint className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Self-Sovereign</h3>
            <p className="text-gray-600">
              You maintain full control over your identity data without intermediaries
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Selective Disclosure</h3>
            <p className="text-gray-600">
              Share only what's necessary with granular control over your information
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Globe className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Stellar Blockchain</h3>
            <p className="text-gray-600">
              Built on Stellar's robust and scalable blockchain infrastructure
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to take control of your identity?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of users who have embraced self-sovereign identity
          </p>
          <Button size="lg" asChild>
            <Link to="/register">Create Your Identity</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
