import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ExternalLink, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Integration, IntegrationType } from '../types';

interface GA4Property {
  name: string;
  displayName: string;
  account: string;
  accountDisplayName: string;
  property: string;
  propertyDisplayName: string;
}

export const Integrations: React.FC = () => {
  const { projectId } = useParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // GA4 Modal State
  const [isGA4ModalOpen, setIsGA4ModalOpen] = useState(false);
  const [ga4Properties, setGA4Properties] = useState<GA4Property[]>([]);
  const [fetchingProperties, setFetchingProperties] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<GA4Property | null>(null);
  const [savingIntegration, setSavingIntegration] = useState(false);

  useEffect(() => {
    if (projectId) loadIntegrations();
  }, [projectId]);

  // Check if returning from OAuth and auto-fetch properties
  useEffect(() => {
    const checkOAuthCallback = async () => {
      const fullUrl = window.location.href;

      // Check if we have OAuth callback indicators
      const hasCode = fullUrl.includes('code=') || fullUrl.includes('access_token=');

      if (hasCode) {
        console.log('🔄 Detected OAuth callback, waiting for session update...');

        // Wait for session to be fully updated
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if we now have Analytics permissions
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.provider_token) {
          console.log('✓ Session updated with provider_token, auto-fetching GA4 properties...');

          // Clean up URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/projects/' + projectId + '/integrations');

          // Auto-fetch GA4 properties
          try {
            await fetchGA4Properties();
          } catch (err) {
            console.error('Auto-fetch failed:', err);
            alert('Erro ao buscar propriedades do Google Analytics. Tente novamente manualmente.');
          }
        } else {
          console.warn('⚠️ OAuth callback detected but no provider_token in session');
        }
      }
    };

    if (projectId) {
      checkOAuthCallback();
    }
  }, [projectId]);

  const loadIntegrations = async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error loading integrations:', error);
        return;
      }

      // Map to Integration interface
      const mappedIntegrations: Integration[] = (data || []).map(integration => ({
        id: integration.id,
        projectId: integration.project_id,
        type: integration.provider as IntegrationType,
        status: integration.status as 'connected' | 'disconnected',
        connectedAt: integration.created_at
      }));

      setIntegrations(mappedIntegrations);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (type: IntegrationType) => {
    return integrations.some(i => i.type === type && i.status === 'connected');
  };

  const fetchGA4Properties = async () => {
    setFetchingProperties(true);
    try {
      // Get current session to extract provider_token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.provider_token) {
        alert('Token de acesso não encontrado. Por favor, faça logout e login novamente para renovar as permissões do Google.');
        return;
      }

      // Fetch GA4 properties from Google Analytics Admin API
      const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GA4 API Error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch GA4 properties: ${response.status}`);
      }

      const data = await response.json();

      // Parse account summaries to extract properties
      const properties: GA4Property[] = [];
      if (data.accountSummaries) {
        data.accountSummaries.forEach((accountSummary: any) => {
          if (accountSummary.propertySummaries) {
            accountSummary.propertySummaries.forEach((propertySummary: any) => {
              properties.push({
                name: propertySummary.property,
                displayName: propertySummary.displayName,
                account: accountSummary.account,
                accountDisplayName: accountSummary.displayName,
                property: propertySummary.property,
                propertyDisplayName: propertySummary.displayName
              });
            });
          }
        });
      }

      setGA4Properties(properties);
      setIsGA4ModalOpen(true);
    } catch (error) {
      console.error('Error fetching GA4 properties:', error);
      setFetchingProperties(false);
      // Re-throw to let handleConnect catch it and request permissions
      throw error;
    } finally {
      setFetchingProperties(false);
    }
  };

  const saveGA4Integration = async () => {
    if (!projectId || !selectedProperty) return;

    setSavingIntegration(true);
    try {
      const { error } = await supabase
        .from('integrations')
        .insert({
          project_id: projectId,
          organization_id: '40dc1851-80bb-4774-b57b-6c9a55977b92', // V4 Company
          provider: 'google_analytics',
          status: 'active',
          metadata: {
            property_id: selectedProperty.property,
            property_name: selectedProperty.propertyDisplayName,
            account_id: selectedProperty.account,
            account_name: selectedProperty.accountDisplayName
          }
        });

      if (error) {
        console.error('Error saving integration:', error);
        alert('Erro ao salvar integração. Tente novamente.');
        return;
      }

      // Success - close modal and reload
      setIsGA4ModalOpen(false);
      setSelectedProperty(null);
      setGA4Properties([]);
      await loadIntegrations();
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleDisconnect = async (type: IntegrationType) => {
    if (!projectId) return;
    setActionLoading(type);

    try {
      // Find the integration to disconnect
      const integration = integrations.find(i => i.type === type && i.status === 'connected');
      if (!integration) return;

      const { error } = await supabase
        .from('integrations')
        .update({ status: 'inactive' })
        .eq('id', integration.id);

      if (error) {
        console.error('Error disconnecting integration:', error);
        alert('Erro ao desconectar. Tente novamente.');
        return;
      }

      await loadIntegrations();
    } finally {
      setActionLoading(null);
    }
  };

  const requestAnalyticsPermissions = async () => {
    try {
      console.log('🔐 Requesting Analytics permissions with identity scopes...');

      // CRITICAL: Include identity scopes (openid profile email) along with data scopes
      // This ensures Google sends user profile information, preventing Supabase auth errors
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/#/projects/${projectId}/integrations`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Force consent screen to get refresh token
            // MAGIC SCOPE STRING: Identity + Analytics + Ads
            scope: 'openid profile email https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/adwords'
          }
        }
      });

      if (error) {
        console.error('❌ Error requesting Analytics permissions:', error);
        alert('Erro ao solicitar permissões do Google Analytics. Tente novamente.');
      } else {
        console.log('✓ OAuth redirect initiated...');
      }
      // User will be redirected to Google OAuth consent screen
    } catch (error) {
      console.error('❌ Error initiating OAuth:', error);
      alert('Erro ao iniciar autenticação. Tente novamente.');
    }
  };

  const handleConnect = async (type: IntegrationType) => {
    setActionLoading(type);
    try {
      if (type === 'ga4') {
        console.log('🚀 Starting GA4 connection flow...');

        // Step 1: Check if we already have a session with provider_token
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.provider_token) {
          console.log('❌ No provider_token found, requesting permissions...');
          await requestAnalyticsPermissions();
          return;
        }

        console.log('✓ Found provider_token, testing GA4 API access...');

        // Step 2: Smart Verification - Test if token has Analytics permissions
        try {
          const testResponse = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
            headers: {
              'Authorization': `Bearer ${session.provider_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (testResponse.ok) {
            console.log('✓ Token has Analytics permissions! Fetching properties...');
            // Token works - fetch properties directly
            await fetchGA4Properties();
            return;
          } else {
            console.log(`⚠️ Token test failed (${testResponse.status}), requesting new permissions...`);
            // Token doesn't have Analytics permissions - request them
            await requestAnalyticsPermissions();
          }
        } catch (error) {
          console.error('⚠️ Token test error:', error);
          // Network error or other issue - request permissions
          await requestAnalyticsPermissions();
        }
      } else {
        alert(`Integração ${type} em desenvolvimento!`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (type: IntegrationType) => {
    const connected = isConnected(type);
    if (connected) {
      await handleDisconnect(type);
    } else {
      await handleConnect(type);
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const Card = ({ 
    type, 
    title, 
    colorClass, 
    icon 
  }: { 
    type: IntegrationType, 
    title: string, 
    colorClass: string, 
    icon: React.ReactNode 
  }) => {
    const connected = isConnected(type);
    const isLoading = actionLoading === type;

    return (
      <div className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 ${connected ? 'border-green-100 shadow-green-50 shadow-lg' : 'border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl'}`}>
        
        {connected && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Connected
            </div>
        )}

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${connected ? 'bg-green-50' : 'bg-gray-50'}`}>
           {icon}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-8 leading-relaxed">
            Connect your {title} account to sync data automatically with your project dashboard.
        </p>

        <button
            onClick={() => handleToggle(type)}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                connected 
                ? 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100' 
                : `${colorClass} text-white shadow-lg hover:brightness-110 transform active:scale-95`
            }`}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : connected ? (
                "Disconnect"
            ) : (
                <>Connect {title} <ExternalLink className="w-4 h-4 opacity-80" /></>
            )}
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Integrations</h1>
        <p className="text-gray-500 text-lg">Supercharge your project by connecting your favorite marketing tools. Real-time sync enabled.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Google Analytics 4 - Orange/Yellow */}
        <Card 
            type="ga4"
            title="Google Analytics 4"
            colorClass="bg-gradient-to-r from-orange-400 to-yellow-500"
            icon={
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 4C16 1.79086 17.7909 0 20 0C22.2091 0 24 1.79086 24 4V24H16V4Z" fill="#F9AB00"/>
                    <path d="M8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12V24H8V12Z" fill="#E37400"/>
                    <path d="M0 20C0 17.7909 1.79086 16 4 16C6.20914 16 8 17.7909 8 20V24H0V20Z" fill="#E37400"/>
                </svg>
            }
        />

        {/* Google Ads - Blue/Green */}
        <Card 
            type="google-ads"
            title="Google Ads"
            colorClass="bg-[#4285F4]"
            icon={
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                    <path d="M15.6 2.6H8.4C8.4 2.6 15.6 2.6 15.6 2.6ZM22.4 11.2L17.2 5.8C16.8 5.4 16.2 5.2 15.6 5.2H8.4C7.8 5.2 7.2 5.4 6.8 5.8L1.6 11.2C1.2 11.6 1 12.2 1 12.8V20C1 21.1 1.9 22 3 22H21C22.1 22 23 21.1 23 20V12.8C23 12.2 22.8 11.6 22.4 11.2Z" fill="#FABB05"/>
                    <path d="M17.2 5.8L22.4 11.2C22.8 11.6 23 12.2 23 12.8V20C23 21.1 22.1 22 21 22H15.6V5.2C16.2 5.2 16.8 5.4 17.2 5.8Z" fill="#34A853"/>
                    <path d="M6.8 5.8L1.6 11.2C1.2 11.6 1 12.2 1 12.8V20C1 21.1 1.9 22 3 22H8.4V5.2C7.8 5.2 7.2 5.4 6.8 5.8Z" fill="#4285F4"/>
                </svg>
            }
        />

        {/* Meta Ads - Blue */}
        <Card 
            type="meta-ads"
            title="Meta Ads"
            colorClass="bg-[#0668E1]"
            icon={
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#0668E1">
                    <path d="M12 2.03c-5.5 0-10 4.5-10 10 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.5-4.5-10-10-10z" fill="currentColor" className="text-blue-600"/>
                </svg>
            }
        />
      </div>

      {/* GA4 Properties Selection Modal */}
      {isGA4ModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Select GA4 Property</h2>
                <p className="text-gray-500 text-sm mt-1">Choose which Google Analytics property to connect</p>
              </div>
              <button
                onClick={() => {
                  setIsGA4ModalOpen(false);
                  setSelectedProperty(null);
                  setGA4Properties([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 overflow-y-auto max-h-[50vh]">
              {fetchingProperties ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                  <p className="text-gray-500">Buscando propriedades do Google Analytics...</p>
                </div>
              ) : ga4Properties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">Nenhuma propriedade encontrada.</p>
                  <p className="text-gray-400 text-sm">Verifique se você tem acesso ao Google Analytics.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ga4Properties.map((property) => (
                    <div
                      key={property.property}
                      onClick={() => setSelectedProperty(property)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedProperty?.property === property.property
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{property.propertyDisplayName}</h3>
                          <p className="text-sm text-gray-500 mt-1">Account: {property.accountDisplayName}</p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">{property.property}</p>
                        </div>
                        {selectedProperty?.property === property.property && (
                          <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setIsGA4ModalOpen(false);
                  setSelectedProperty(null);
                  setGA4Properties([]);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveGA4Integration}
                disabled={!selectedProperty || savingIntegration}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-yellow-500 hover:brightness-110 text-white font-semibold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {savingIntegration ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar Propriedade'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};