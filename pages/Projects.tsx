import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Folder, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Project, Squad } from '../types';

export const Projects: React.FC = () => {
  const { squadId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [squad, setSquad] = useState<Squad | undefined>();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (squadId) {
      loadData();
    }
  }, [squadId]);

  const loadData = async () => {
    if (!squadId) return;
    try {
      // Fetch projects from Supabase
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('squad_id', squadId)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
      }

      // Fetch squad info from Supabase
      const { data: squadData, error: squadError } = await supabase
        .from('squads')
        .select('*')
        .eq('id', squadId)
        .single();

      if (squadError) {
        console.error('Error loading squad:', squadError);
      }

      // Map projects to interface format
      const mappedProjects: Project[] = (projectsData || []).map(project => ({
        id: project.id,
        squadId: project.squad_id,
        name: project.name,
        status: project.status,
        createdAt: project.created_at
      }));

      // Map squad to interface format
      const mappedSquad: Squad | undefined = squadData ? {
        id: squadData.id,
        name: squadData.name,
        description: squadData.description,
        createdAt: squadData.created_at
      } : undefined;

      setProjects(mappedProjects);
      setSquad(mappedSquad);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Verificação de segurança: Squad ID deve existir
      if (!squadId) {
        alert('Squad ID não encontrado. Por favor, tente novamente.');
        return;
      }

      const { error } = await supabase
        .from('projects')
        .insert([
          {
            name: projectName,
            status: 'active',
            squad_id: squadId,
            organization_id: '40dc1851-80bb-4774-b57b-6c9a55977b92' // V4 Company
          }
        ]);

      if (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project. Please try again.');
        return;
      }

      setProjectName('');
      setIsModalOpen(false);
      loadData();
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
            <div className="flex items-center gap-2 text-indigo-600 font-medium mb-1">
                <span className="text-xs uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Squad Context</span>
            </div>
          <h1 className="text-3xl font-bold text-gray-900">{squad?.name} Projects</h1>
          <p className="text-gray-500 mt-1">Select a project to configure integrations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started.</p>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 font-medium hover:text-indigo-700"
            >
                Create Project
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => (
            <div 
                key={project.id}
                onClick={() => navigate(`/squads/${squadId}/projects/${project.id}/integrations`)}
                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <Folder className="w-5 h-5" />
                    </div>
                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                        {project.status.toUpperCase()}
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                </h3>
                
                <div className="flex items-center text-gray-400 text-xs mt-4">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(project.createdAt).toLocaleDateString()}
                </div>
                
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-indigo-600" />
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input 
                  required
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="e.g. Summer Campaign 2024"
                />
              </div>
              <div className="flex gap-3">
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