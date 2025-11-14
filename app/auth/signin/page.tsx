'use client';

import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { data: session } = useSession();

  // Player name input (prefilled from email prefix if available, else localStorage)
  const [playerName, setPlayerName] = useState<string>('');
  useEffect(() => {
    try {
      const stored = localStorage.getItem('preferred_player_name');
      if (stored) {
        setPlayerName(stored);
        return;
      }
    } catch {}
    const email = (session as any)?.user?.email as string | undefined;
    if (email && email.includes('@')) {
      const pref = email.split('@')[0];
      setPlayerName(pref);
    }
  }, [session?.user?.email]);

  const handleSignIn = async (provider: 'google' | 'facebook') => {
    setIsLoading(provider);
    try {
      try { localStorage.setItem('preferred_player_name', (playerName || '').trim().slice(0, 24)); } catch {}
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl top-1/2 left-1/2 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-4 sm:p-8">
        {/* Logo/Title Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🎴</div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 sm:mb-2">
              Teen Patti
            </h1>
            <p className="text-white/80 text-base sm:text-lg">
              3-Player Card Game
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error === 'OAuthSignin' && 'Error connecting to OAuth provider'}
              {error === 'OAuthCallback' && 'Error in OAuth callback'}
              {error === 'OAuthCreateAccount' && 'Could not create account'}
              {error === 'EmailCreateAccount' && 'Could not create email account'}
              {error === 'Callback' && 'Authentication callback error'}
              {error === 'Default' && 'An error occurred during sign in'}
            </div>
          )}

          {/* Player Name (optional, used as in-game display name) */}
          <div className="mb-6">
            <label className="block text-white/80 text-sm mb-1">Player name</label>
            <div className="flex gap-2">
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={24}
                placeholder="Your display name"
                className="flex-1 rounded-lg px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40"
              />
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('preferred_player_name', (playerName || '').trim().slice(0, 24));
                  } catch {}
                }}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg border border-white/20"
                type="button"
                title="Save name"
              >
                Save
              </button>
            </div>
            <p className="mt-1 text-white/60 text-xs">Used as your in-game name. You can change it later before a game starts.</p>
          </div>

          {/* Sign In Buttons */}
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              onClick={() => handleSignIn('google')}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading === 'google' ? (
                <>
                  <div className="w-5 h-5 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Facebook Sign In */}
            <button
              onClick={() => handleSignIn('facebook')}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading === 'facebook' ? (
                <>
                  <div className="w-5 h-5 border-3 border-blue-300 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Continue with Facebook</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/60">OR</span>
            </div>
          </div>

          {/* Guest Continue */}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
          >
            Continue as Guest 👤
          </button>

          {/* Info Text */}
          <p className="text-center text-white/60 text-sm mt-6">
            Sign in to save your progress and compete on the leaderboard
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm">
          <p>© 2024 Teen Patti Game. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

