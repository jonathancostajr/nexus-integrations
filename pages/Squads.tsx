import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Squad } from '../types';

export const Squads: React.FC = () => {
  const navigate = useNavigate();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadDesc, setNewSquadDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSquads();
  }, []);

  const loadSquads = async () => {
    try {
      const { data, error } = await supabase
        .from('squads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading squads:', error);
        return;
      }

      // Map database fields to interface format
      const mappedSquads: Squad[] = (data || []).map(squad => ({
        id: squad.id,
        name: squad.name,
        description: squad.description,
        createdAt: squad.created_at
      }));

      setSquads(mappedSquads);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { error } = await supabase
        .from('squads')
        .insert([
          {
            name: newSquadName,
            description: newSquadDesc,
            organization_id: '40dc1851-80bb-4774-b57b-6c9a55977b92' // V4 Company
          }
        ]);

      if (error) {
        console.error('Error creating squad:', error);
        alert('Failed to create squad. Please try again.');
        return;
      }

      setNewSquadName('');
      setNewSquadDesc('');
      setIsModalOpen(false);
      loadSquads();
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Squads</h1>
          <p className="text-gray-500 mt-1">Manage teams and their respective projects.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-slate-200"
        >
          <Plus className="w-5 h-5" />
          New Squad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.map((squad) => (
          <div 
            key={squad.id}
            onClick={() => navigate(`/squads/${squad.id}/projects`)}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{squad.name}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{squad.description}</p>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-xs text-gray-400 font-medium">
                <span>ID: {squad.id}</span>
                <span className="mx-2">•</span>
                <span>Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Squad</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Squad Name</label>
                  <input 
                    required
                    value={newSquadName}
                    onChange={e => setNewSquadName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="e.g. Growth Team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    required
                    value={newSquadDesc}
                    onChange={e => setNewSquadDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="What is this squad responsible for?"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex justify-center items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};