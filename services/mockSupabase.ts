import { Squad, Project, Integration, User, IntegrationType } from '../types';

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initial Data
const SEED_SQUADS: Squad[] = [
  { id: 'sq-1', name: 'Growth Team', description: 'Marketing and Acquisition', createdAt: new Date().toISOString() },
  { id: 'sq-2', name: 'Product Core', description: 'Main Platform Features', createdAt: new Date().toISOString() },
];

const SEED_PROJECTS: Project[] = [
  { id: 'pj-1', squadId: 'sq-1', name: 'Q4 Campaign', status: 'active', createdAt: new Date().toISOString() },
  { id: 'pj-2', squadId: 'sq-1', name: 'SEO Overhaul', status: 'active', createdAt: new Date().toISOString() },
];

const SEED_INTEGRATIONS: Integration[] = [
  { id: 'int-1', projectId: 'pj-1', type: 'ga4', status: 'connected', connectedAt: new Date().toISOString() }
];

// LocalStorage Keys
const KEYS = {
  USER: 'nexus_user',
  SQUADS: 'nexus_squads',
  PROJECTS: 'nexus_projects',
  INTEGRATIONS: 'nexus_integrations'
};

// Initialize DB
const initDb = () => {
  if (!localStorage.getItem(KEYS.SQUADS)) localStorage.setItem(KEYS.SQUADS, JSON.stringify(SEED_SQUADS));
  if (!localStorage.getItem(KEYS.PROJECTS)) localStorage.setItem(KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
  if (!localStorage.getItem(KEYS.INTEGRATIONS)) localStorage.setItem(KEYS.INTEGRATIONS, JSON.stringify(SEED_INTEGRATIONS));
};

initDb();

export const authService = {
  signInWithGoogle: async (): Promise<{ user: User | null, error: any }> => {
    await delay(800);
    const user: User = { id: 'usr-1', email: 'demo@nexus.com', name: 'Demo User' };
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    return { user, error: null };
  },
  signOut: async () => {
    localStorage.removeItem(KEYS.USER);
  },
  getUser: () => {
    const u = localStorage.getItem(KEYS.USER);
    return u ? JSON.parse(u) as User : null;
  }
};

export const dataService = {
  getSquads: async (): Promise<Squad[]> => {
    await delay(400);
    return JSON.parse(localStorage.getItem(KEYS.SQUADS) || '[]');
  },
  
  createSquad: async (name: string, description: string): Promise<Squad> => {
    await delay(600);
    const squads = JSON.parse(localStorage.getItem(KEYS.SQUADS) || '[]');
    const newSquad: Squad = {
      id: `sq-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.SQUADS, JSON.stringify([...squads, newSquad]));
    return newSquad;
  },

  getSquadById: async (id: string): Promise<Squad | undefined> => {
    await delay(200);
    const squads = JSON.parse(localStorage.getItem(KEYS.SQUADS) || '[]');
    return squads.find((s: Squad) => s.id === id);
  },

  getProjects: async (squadId: string): Promise<Project[]> => {
    await delay(400);
    const projects = JSON.parse(localStorage.getItem(KEYS.PROJECTS) || '[]');
    return projects.filter((p: Project) => p.squadId === squadId);
  },

  getProjectById: async (id: string): Promise<Project | undefined> => {
    await delay(200);
    const projects = JSON.parse(localStorage.getItem(KEYS.PROJECTS) || '[]');
    return projects.find((p: Project) => p.id === id);
  },

  createProject: async (squadId: string, name: string): Promise<Project> => {
    await delay(600);
    const projects = JSON.parse(localStorage.getItem(KEYS.PROJECTS) || '[]');
    const newProject: Project = {
      id: `pj-${Date.now()}`,
      squadId,
      name,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify([...projects, newProject]));
    return newProject;
  },

  getIntegrations: async (projectId: string): Promise<Integration[]> => {
    await delay(400);
    const integrations = JSON.parse(localStorage.getItem(KEYS.INTEGRATIONS) || '[]');
    return integrations.filter((i: Integration) => i.projectId === projectId);
  },

  toggleIntegration: async (projectId: string, type: IntegrationType): Promise<Integration | null> => {
    await delay(800);
    const integrations: Integration[] = JSON.parse(localStorage.getItem(KEYS.INTEGRATIONS) || '[]');
    const existingIndex = integrations.findIndex(i => i.projectId === projectId && i.type === type);

    if (existingIndex >= 0) {
      // Disconnect
      const updated = integrations.filter((_, idx) => idx !== existingIndex);
      localStorage.setItem(KEYS.INTEGRATIONS, JSON.stringify(updated));
      return null;
    } else {
      // Connect
      const newIntegration: Integration = {
        id: `int-${Date.now()}`,
        projectId,
        type,
        status: 'connected',
        connectedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.INTEGRATIONS, JSON.stringify([...integrations, newIntegration]));
      return newIntegration;
    }
  }
};