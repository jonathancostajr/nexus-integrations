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
                console.log('=== AUTH CALLBACK DEBUG ===');
                console.log('Full URL:', window.location.href);
                console.log('Location Hash:', window.location.hash);
                console.log('Location Search:', window.location.search);

                const fullUrl = window.location.href;

                // Check for OAuth errors first
                if (fullUrl.includes('error=') || fullUrl.includes('error_description=')) {
                    const errorMatch = fullUrl.match(/error=([^&]+)/);
                    const errorDescMatch = fullUrl.match(/error_description=([^&]+)/);
                    const errorMsg = errorDescMatch ? decodeURIComponent(errorDescMatch[1]) : (errorMatch ? errorMatch[1] : 'OAuth error');
                    console.error('OAuth Error in URL:', errorMsg);
                    throw new Error(errorMsg);
                }

                // Manual token extraction - handle double hash problem
                let accessToken: string | null = null;
                let refreshToken: string | null = null;
                let code: string | null = null;

                // Method 1: Try to extract access_token from URL (implicit flow)
                if (fullUrl.includes('access_token=')) {
                    const accessTokenMatch = fullUrl.match(/access_token=([^&]+)/);
                    if (accessTokenMatch) {
                        accessToken = accessTokenMatch[1];
                        console.log('✓ Found access_token in URL');
                    }
                }

                // Method 2: Try to extract refresh_token from URL
                if (fullUrl.includes('refresh_token=')) {
                    const refreshTokenMatch = fullUrl.match(/refresh_token=([^&]+)/);
                    if (refreshTokenMatch) {
                        refreshToken = refreshTokenMatch[1];
                        console.log('✓ Found refresh_token in URL');
                    }
                }

                // Method 3: Try to extract code from URL (PKCE flow)
                if (fullUrl.includes('code=')) {
                    const codeMatch = fullUrl.match(/code=([^&]+)/);
                    if (codeMatch) {
                        code = codeMatch[1];
                        console.log('✓ Found code in URL');
                    }
                }

                console.log('Extracted tokens:', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    hasCode: !!code
                });

                // Strategy 1: If we have access_token and refresh_token, use setSession
                if (accessToken && refreshToken) {
                    console.log('Using setSession with extracted tokens...');

                    const { data, error: setSessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (setSessionError) {
                        console.error('setSession error:', setSessionError);
                        throw setSessionError;
                    }

                    if (data.session) {
                        console.log('✓ Session created successfully:', {
                            userId: data.session.user.id,
                            email: data.session.user.email,
                            hasProviderToken: !!data.session.provider_token
                        });

                        // Store user info
                        const user = {
                            id: data.session.user.id,
                            email: data.session.user.email || '',
                            name: data.session.user.user_metadata.full_name ||
                                  data.session.user.user_metadata.name ||
                                  data.session.user.email ||
                                  'User'
                        };
                        localStorage.setItem('nexus_user', JSON.stringify(user));

                        // Clean URL and redirect
                        window.history.replaceState(null, '', window.location.pathname + '#/squads');
                        setLoading(false);
                        navigate('/squads');
                        return;
                    }
                }

                // Strategy 2: If we have only access_token (implicit flow without refresh)
                if (accessToken && !refreshToken) {
                    console.log('Using setSession with access_token only...');

                    try {
                        const { data, error: setSessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: '' // Supabase may handle this
                        });

                        if (setSessionError) throw setSessionError;

                        if (data.session) {
                            console.log('✓ Session created with access_token only');

                            const user = {
                                id: data.session.user.id,
                                email: data.session.user.email || '',
                                name: data.session.user.user_metadata.full_name ||
                                      data.session.user.user_metadata.name ||
                                      data.session.user.email ||
                                      'User'
                            };
                            localStorage.setItem('nexus_user', JSON.stringify(user));

                            window.history.replaceState(null, '', window.location.pathname + '#/squads');
                            setLoading(false);
                            navigate('/squads');
                            return;
                        }
                    } catch (err) {
                        console.warn('setSession with access_token only failed, trying PKCE...');
                    }
                }

                // Strategy 3: If we have code, try PKCE exchange
                if (code) {
                    console.log('Using exchangeCodeForSession with code...');

                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                    if (exchangeError) {
                        console.error('exchangeCodeForSession error:', exchangeError);
                        throw exchangeError;
                    }

                    if (data.session) {
                        console.log('✓ Session created via PKCE exchange');

                        const user = {
                            id: data.session.user.id,
                            email: data.session.user.email || '',
                            name: data.session.user.user_metadata.full_name ||
                                  data.session.user.user_metadata.name ||
                                  data.session.user.email ||
                                  'User'
                        };
                        localStorage.setItem('nexus_user', JSON.stringify(user));

                        window.history.replaceState(null, '', window.location.pathname + '#/squads');
                        setLoading(false);
                        navigate('/squads');
                        return;
                    }
                }

                // Strategy 4: Try to get existing session (fallback)
                console.log('No tokens found in URL, checking for existing session...');

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('getSession error:', sessionError);
                    throw sessionError;
                }

                if (session) {
                    console.log('✓ Existing session found');

                    const user = {
                        id: session.user.id,
                        email: session.user.email || '',
                        name: session.user.user_metadata.full_name ||
                              session.user.user_metadata.name ||
                              session.user.email ||
                              'User'
                    };
                    localStorage.setItem('nexus_user', JSON.stringify(user));

                    window.history.replaceState(null, '', window.location.pathname + '#/squads');
                    setLoading(false);
                    navigate('/squads');
                    return;
                }

                // If we get here, nothing worked
                throw new Error('Não foi possível autenticar. Nenhum token ou código válido encontrado na URL.');

            } catch (err) {
                console.error('=== AUTH CALLBACK ERROR ===');
                console.error('Error:', err);
                console.error('Full error details:', {
                    message: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined,
                    url: window.location.href
                });

                setError(err instanceof Error ? err.message : 'Falha na autenticação. Tente novamente.');
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
                <h2 className="text-white text-2xl font-bold mb-3">Erro de Autenticação</h2>
                <p className="text-slate-300 text-center max-w-md mb-2">{error}</p>
                <p className="text-slate-500 text-sm mt-1">Verifique o console do navegador (F12) para mais detalhes.</p>
                <p className="text-slate-500 text-sm mt-4">Redirecionando para o login em 4 segundos...</p>
                <button
                    onClick={() => {
                        window.history.replaceState(null, '', window.location.pathname + '#/login');
                        navigate('/login');
                    }}
                    className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                    Voltar para Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="bg-indigo-500/10 rounded-full p-6 mb-6">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Completando login...</h2>
            <p className="text-slate-400 text-center max-w-md">
                {loading ? 'Processando autenticação...' : 'Você será redirecionado em instantes.'}
            </p>
            <p className="text-slate-500 text-xs mt-4">
                Caso demore muito, verifique o console (F12) e reporte o problema.
            </p>
        </div>
    );
};
