'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, LogIn, LogOut, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'

interface User {
  id: string
  discordId: string
  username: string
  avatar: string | null
  isAdmin: boolean
  hasRequiredRole: boolean
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.reload()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-movement-black/80 backdrop-blur-md border-b border-movement-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden transform group-hover:scale-105 transition-transform">
              <Image 
                src="/logo.png" 
                alt="Movement Core NFTs" 
                width={40} 
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-white text-lg tracking-wider">MOVEMENT</span>
              <span className="font-display text-movement-yellow text-lg tracking-wider ml-1">CORE NFTs</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-movement-gray-300 hover:text-white transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              href="/history" 
              className="text-movement-gray-300 hover:text-white transition-colors font-medium"
            >
              History
            </Link>
            {user?.isAdmin && (
              <Link 
                href="/admin" 
                className="text-movement-gray-300 hover:text-white transition-colors font-medium flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-movement-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-movement-gray-800/50 rounded-full border border-movement-gray-700">
                  {user.avatar ? (
                    <Image 
                      src={user.avatar} 
                      alt={user.username} 
                      width={28} 
                      height={28} 
                      className="rounded-full ring-2 ring-movement-yellow/30"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-movement-yellow flex items-center justify-center">
                      <span className="text-movement-black font-bold text-sm">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-white text-sm font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-movement-gray-400 hover:text-white hover:bg-movement-gray-800 rounded-lg transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="btn-primary"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign in with Discord</span>
                <span className="sm:hidden">Sign in</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-movement-gray-400 hover:text-white hover:bg-movement-gray-800 rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-movement-gray-900/95 backdrop-blur-md border-t border-movement-gray-800">
          <nav className="px-4 py-4 space-y-1">
            <Link 
              href="/" 
              className="block px-4 py-3 text-movement-gray-300 hover:text-white hover:bg-movement-gray-800 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/history" 
              className="block px-4 py-3 text-movement-gray-300 hover:text-white hover:bg-movement-gray-800 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              History
            </Link>
            {user?.isAdmin && (
              <Link 
                href="/admin" 
                className="block px-4 py-3 text-movement-gray-300 hover:text-white hover:bg-movement-gray-800 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
          </nav>
          
          {user && (
            <div className="px-4 py-4 border-t border-movement-gray-800">
              <div className="flex items-center gap-3 px-4">
                {user.avatar ? (
                  <Image 
                    src={user.avatar} 
                    alt={user.username} 
                    width={36} 
                    height={36} 
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-movement-yellow flex items-center justify-center">
                    <span className="text-movement-black font-bold">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{user.username}</p>
                  <p className="text-movement-gray-500 text-sm">Connected</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}