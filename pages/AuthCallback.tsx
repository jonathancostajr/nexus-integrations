import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Extract parameters from both query string and hash
                const queryParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.substring(1));

                // Check for OAuth errors first (can be in either location)
                const oauthError = queryParams.get('error') || hashParams.get('error');
                const oauthErrorDesc = queryParams.get('error_description') || hashParams.get('error_description');

                if (oauthError) {
                    console.error('OAuth Error:', oauthError, oauthErrorDesc);
                    throw new Error(oauthErrorDesc || oauthError || 'OAuth authentication failed');
                }

                // Try to get code from query params first (standard OAuth), then hash
                let code = queryParams.get('code') || hashParams.get('code');

                // Try to get access_token from hash (implicit flow fallback)
                const accessToken = hashParams.get('access_token');

                console.log('Auth Callback - Debug Info:', {
                    hasCode: !!code,
                    hasAccessToken: !!accessToken,
                    queryString: window.location.search,
                    hash: window.location.hash
                });

                if (code) {
                    console.log('Processing PKCE code exchange...');

                    // Exchange code for session using PKCE
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                    if (exchangeError) {
                        console.error('Code exchange error:', exchangeError);
                        throw exchangeError;
                    }

                    if (data.session) {
                        console.log('Session obtained successfully:', {
                            userId: data.session.user.id,
                            email: data.session.user.email,
                            hasProviderToken: !!data.session.provider_token
                        });

                        // Store user info in localStorage
                        const user = {
                            id: data.session.user.id,
                            email: data.session.user.email || '',
                            name: data.session.user.user_metadata.full_name ||
                                  data.session.user.user_metadata.name ||
                                  data.session.user.email ||
                                  'User'
                        };
                        localStorage.setItem('nexus_user', JSON.stringify(user));

                        // Clean up URL
                        window.history.replaceState(null, '', window.location.pathname + '#/squads');

                        // Navigate to squads
                        setLoading(false);
                        navigate('/squads');
                        return;
                    }
                } else if (accessToken) {
                    console.log('Processing implicit flow with access_token...');

                    // If we have an access token (implicit flow), get the current session
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                    if (sessionError) {
                        console.error('Session retrieval error:', sessionError);
                        throw sessionError;
                    }

                    if (session) {
                        console.log('Session found via implicit flow:', {
                            userId: session.user.id,
                            email: session.user.email
                        });

                        const user = {
                            id: session.user.id,
                            email: session.user.email || '',
                            name: session.user.user_metadata.full_name ||
                                  session.user.user_metadata.name ||
                                  session.user.email ||
                                  'User'
                        };
                        localStorage.setItem('nexus_user', JSON.stringify(user));

                        // Clean up URL
                        window.history.replaceState(null, '', window.location.pathname + '#/squads');

                        // Navigate to squads
                        setLoading(false);
                        navigate('/squads');
                        return;
                    }
                } else {
                    // No code or access_token found, try getting existing session
                    console.log('No code or access_token found, checking for existing session...');

                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                    if (sessionError) {
                        console.error('Session check error:', sessionError);
                        throw sessionError;
                    }

                    if (session) {
                        console.log('Existing session found:', {
                            userId: session.user.id,
                            email: session.user.email
                        });

                        const user = {
                            id: session.user.id,
                            email: session.user.email || '',
                            name: session.user.user_metadata.full_name ||
                                  session.user.user_metadata.name ||
                                  session.user.email ||
                                  'User'
                        };
                        localStorage.setItem('nexus_user', JSON.stringify(user));

                        // Clean up URL
                        window.history.replaceState(null, '', window.location.pathname + '#/squads');

                        // Navigate to squads
                        setLoading(false);
                        navigate('/squads');
                        return;
                    }

                    // No session found at all
                    throw new Error('No authentication code or session found. Please try logging in again.');
                }

                // If we get here, something went wrong
                throw new Error('Authentication completed but no valid session was created');

            } catch (err) {
                console.error('Auth callback error:', err);
                console.error('Full error details:', {
                    message: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined,
                    url: window.location.href
                });

                setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
                setLoading(false);

                // Redirect to login after 4 seconds
                setTimeout(() => {
                    window.history.replaceState(null, '', window.location.pathname + '#/login');
                    navigate('/login');
                }, 4000);
            }
        };

        handleCallback();
    }, [navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="bg-red-500/10 rounded-full p-4 mb-6">
                    <div className="text-red-500 text-3xl">⚠️</div>
                </div>
                <h2 className="text-white text-2xl font-bold mb-3">Authentication Error</h2>
                <p className="text-slate-300 text-center max-w-md mb-2">{error}</p>
                <p className="text-slate-500 text-sm mt-4">Redirecting to login in 4 seconds...</p>
                <button
                    onClick={() => {
                        window.history.replaceState(null, '', window.location.pathname + '#/login');
                        navigate('/login');
                    }}
                    className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="bg-indigo-500/10 rounded-full p-6 mb-6">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Completing login...</h2>
            <p className="text-slate-400 text-center max-w-md">
                {loading ? 'Processing authentication...' : 'You will be redirected in a moment.'}
            </p>
        </div>
    );
};
