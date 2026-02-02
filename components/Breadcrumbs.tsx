import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { dataService } from '../services/mockSupabase';

// A "smart" breadcrumb that fetches names based on IDs in the URL
export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const [squadName, setSquadName] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

  // Parse IDs from URL to fetch readable names
  useEffect(() => {
    const fetchNames = async () => {
      const squadIdIndex = pathnames.indexOf('squads') + 1;
      const projectIdIndex = pathnames.indexOf('projects') + 1;

      if (squadIdIndex > 0 && pathnames[squadIdIndex]) {
        const s = await dataService.getSquadById(pathnames[squadIdIndex]);
        if (s) setSquadName(s.name);
      } else {
        setSquadName(null);
      }

      if (projectIdIndex > 0 && pathnames[projectIdIndex]) {
        const p = await dataService.getProjectById(pathnames[projectIdIndex]);
        if (p) setProjectName(p.name);
      } else {
        setProjectName(null);
      }
    };
    fetchNames();
  }, [location.pathname]);

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <Link to="/squads" className="hover:text-gray-900 transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        // Skip rendering the ID segments directly, we render the Names instead
        const isIdSegment = value.startsWith('sq-') || value.startsWith('pj-');
        if (isIdSegment) return null;

        let displayName = value.charAt(0).toUpperCase() + value.slice(1);

        // Logic to insert the Name before the next segment resource
        // If current is 'squads', look ahead for ID
        // If current is 'projects', look ahead for ID
        
        // Simplified Logic: 
        // 1. Render "Squads" -> Link to /squads
        // 2. Render Squad Name -> Link to /squads/:id/projects
        // 3. Render Project Name -> Link to /squads/:id/projects/:pid/integrations
        
        return null; // Custom logic below is cleaner
      })}

      {/* Manual Breadcrumb Construction for Stability */}
      {pathnames.includes('squads') && (
        <>
           <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
           <Link to="/squads" className={`hover:text-indigo-600 ${location.pathname === '/squads' ? 'font-semibold text-gray-900' : ''}`}>Squads</Link>
        </>
      )}

      {squadName && (
        <>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <span className={` ${projectName ? 'hover:text-indigo-600 cursor-pointer' : 'font-semibold text-gray-900'}`}>
            {/* If we are deep, link back, else just text */}
            {projectName ? (
                <Link to={`/squads/${pathnames[pathnames.indexOf('squads') + 1]}/projects`}>{squadName}</Link>
            ) : squadName}
          </span>
        </>
      )}

      {projectName && (
        <>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <span className="font-semibold text-gray-900">{projectName}</span>
        </>
      )}
    </nav>
  );
};