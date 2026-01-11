'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to access this application.'
      case 'Verification':
        return 'The verification link has expired or has already been used.'
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.'
      case 'OAuthCallback':
        return 'Error in handling the response from Discord.'
      case 'OAuthCreateAccount':
        return 'Could not create account with Discord.'
      case 'EmailCreateAccount':
        return 'Could not create account with the provided email.'
      case 'Callback':
        return 'Error in the OAuth callback handler.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.'
      case 'SessionRequired':
        return 'You must be signed in to access this page.'
      default:
        return 'An unexpected error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 blur-xl animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Authentication Error
        </h1>
        <p className="text-movement-gray-400 mb-8">
          {getErrorMessage()}
        </p>

        {/* Error Code */}
        {error && (
          <div className="inline-block px-4 py-2 bg-movement-gray-800 rounded-lg mb-8">
            <code className="text-sm text-movement-gray-400">
              Error code: {error}
            </code>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signin" className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Link>
          <Link href="/" className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-movement-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
