import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const IntegrationsCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando conexão com Google Analytics...');

  useEffect(() => {
    const processTokens = async () => {
      try {
        console.log('🔄 IntegrationsCallback - Processing OAuth tokens...');

        // 1. Captura o project_id passado na URL de redirecionamento
        const projectId = searchParams.get('project');

        if (!projectId) {
          console.error('❌ Project ID missing from URL');
          throw new Error('Project ID não encontrado na URL de redirecionamento.');
        }

        console.log('✓ Project ID:', projectId);

        // 2. Extrai tokens do hash da URL (Google OAuth retorna no hash)
        // Formato: #access_token=...&refresh_token=...&expires_in=...
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);

        console.log('📋 Hash params:', {
          hasAccessToken: hashParams.has('access_token'),
          hasRefreshToken: hashParams.has('refresh_token'),
          hasProviderToken: hashParams.has('provider_token')
        });

        // Tenta múltiplos nomes de parâmetros (Google pode usar diferentes nomes)
        const accessToken = hashParams.get('provider_token') ||
                           hashParams.get('access_token');
        const refreshToken = hashParams.get('provider_refresh_token') ||
                            hashParams.get('refresh_token');

        if (!accessToken) {
          console.error('❌ No access token found in URL hash');

          // Fallback: tenta pegar do Supabase session
          console.log('⏳ Trying to get token from Supabase session...');
          await new Promise(resolve => setTimeout(resolve, 1500));

          const { data: { session } } = await supabase.auth.getSession();

          if (session?.provider_token) {
            console.log('✓ Got token from Supabase session');
            return handleSessionToken(session.provider_token, session.provider_refresh_token || '', projectId);
          }

          throw new Error('Nenhum token de acesso encontrado na URL ou sessão.');
        }

        console.log('✓ Access token found');
        setMessage('Salvando credenciais no banco de dados...');

        // 3. Salva tokens na tabela integrations (upsert)
        console.log('💾 Saving tokens to database...');

        const { error: upsertError } = await supabase
          .from('integrations')
          .upsert({
            project_id: projectId,
            organization_id: '40dc1851-80bb-4774-b57b-6c9a55977b92',
            provider: 'google_analytics',
            status: 'active',
            metadata: {
              access_token: accessToken,
              refresh_token: refreshToken || '',
              connected_at: new Date().toISOString()
            }
          }, {
            onConflict: 'project_id,provider'
          });

        if (upsertError) {
          console.error('❌ Database error:', upsertError);
          throw upsertError;
        }

        console.log('✓ Tokens saved successfully!');

        // 4. Sucesso!
        setStatus('success');
        setMessage('Google Analytics conectado com sucesso!');

        // Aguarda 2 segundos para o usuário ver a mensagem
        setTimeout(() => {
          console.log('🔀 Redirecting to integrations page...');
          navigate(`/projects/${projectId}/integrations`);
        }, 2000);

      } catch (error) {
        console.error('❌ Error in IntegrationsCallback:', error);

        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro ao processar autenticação.');

        // Redireciona de volta após 3 segundos
        const projectId = searchParams.get('project');
        setTimeout(() => {
          if (projectId) {
            navigate(`/projects/${projectId}/integrations`);
          } else {
            navigate('/squads');
          }
        }, 3000);
      }
    };

    const handleSessionToken = async (accessToken: string, refreshToken: string, projectId: string) => {
      try {
        setMessage('Salvando credenciais da sessão...');

        const { error: upsertError } = await supabase
          .from('integrations')
          .upsert({
            project_id: projectId,
            organization_id: '40dc1851-80bb-4774-b57b-6c9a55977b92',
            provider: 'google_analytics',
            status: 'active',
            metadata: {
              access_token: accessToken,
              refresh_token: refreshToken,
              connected_at: new Date().toISOString()
            }
          }, {
            onConflict: 'project_id,provider'
          });

        if (upsertError) throw upsertError;

        setStatus('success');
        setMessage('Google Analytics conectado com sucesso!');

        setTimeout(() => {
          navigate(`/projects/${projectId}/integrations`);
        }, 2000);
      } catch (error) {
        throw error;
      }
    };

    processTokens();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="bg-indigo-500/10 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Conectando...</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-500/10 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Conectado!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecionando em instantes...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-500/10 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Erro na Conexão</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecionando de volta...</p>
          </>
        )}
      </div>
    </div>
  );
};
