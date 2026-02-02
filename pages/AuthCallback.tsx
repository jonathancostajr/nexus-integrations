import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the code from URL hash parameters
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const code = hashParams.get('code');

                if (code) {
                    // Exchange code for session using PKCE
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) throw error;

                    if (data.session) {
                        // Store user info in localStorage
                        const user = {
                            id: data.session.user.id,
                            email: data.session.user.email || '',
                            name: data.session.user.user_metadata.full_name || data.session.user.email || 'User'
                        };
                        localStorage.setItem('nexus_user', JSON.stringify(user));
                        navigate('/squads');
                    }
                } else {
                    // No code found, try getting existing session
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        const user = {
                            id: session.user.id,
                            email: session.user.email || '',
                            name: session.user.user_metadata.full_name || session.user.email || 'User'
                        };
                        localStorage.setItem('nexus_user', JSON.stringify(user));
                        navigate('/squads');
                    } else {
                        throw new Error('No authentication code received');
                    }
                }
            } catch (err) {
                console.error('Auth callback error:', err);
                setError(err instanceof Error ? err.message : 'Authentication failed');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="text-red-500 mb-4 text-xl">⚠️</div>
                <h2 className="text-white text-xl font-medium mb-2">Authentication Error</h2>
                <p className="text-slate-400 text-center max-w-md">{error}</p>
                <p className="text-slate-500 text-sm mt-4">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <h2 className="text-white text-xl font-medium">Completing login...</h2>
            <p className="text-slate-400 mt-2">You will be redirected in a moment.</p>
        </div>
    );
};
