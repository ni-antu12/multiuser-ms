import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Users, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react';
import { FamilyGroup } from '../types';
import { apiService } from '../services/api';

const FamilyGroups: React.FC = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFamilyGroups = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getAllFamilyGroups();
        setFamilyGroups(data);
      } catch (err) {
        setError('Error al cargar los grupos familiares');
        console.error('Family groups error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyGroups();
  }, []);

  const filteredGroups = familyGroups.filter(group =>
    group.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.tokenApp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (uuid: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este grupo familiar?')) {
      return;
    }

    try {
      await apiService.deleteFamilyGroup(uuid);
      setFamilyGroups(groups => groups.filter(group => group.uuid !== uuid));
    } catch (err) {
      setError('Error al eliminar el grupo familiar');
      console.error('Delete error:', err);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // Aquí podrías agregar una notificación de éxito
  };

  const toggleDropdown = (uuid: string) => {
    setOpenDropdown(openDropdown === uuid ? null : uuid);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grupos Familiares</h1>
          <p className="text-gray-600 mt-1">Administra los grupos familiares del sistema</p>
        </div>
        <Link
          to="/family-groups/new"
          className="btn-primary space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Grupo</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por UUID, líder o token..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay grupos familiares</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron grupos que coincidan con la búsqueda.' : 'Comienza creando un nuevo grupo familiar.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/family-groups/new"
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Grupo Familiar
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.uuid} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Grupo {group.uuid}</h3>
                    <p className="text-sm text-gray-500">Líder: {group.leader}</p>
                  </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => toggleDropdown(group.uuid)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  {openDropdown === group.uuid && (
                    <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <Link
                          to={`/family-groups/${group.uuid}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Link>
                        <Link
                          to={`/family-groups/${group.uuid}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                        <button
                          onClick={() => {
                            handleCopyToken(group.tokenApp);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar token
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(group.uuid);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Miembros</span>
                  <span className="text-sm font-medium text-gray-900">
                    {group._count?.users || 0} / {group.maxMembers}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Token App</span>
                  <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {group.tokenApp}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Creado</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (group._count?.users || 0) >= group.maxMembers
                        ? 'bg-red-500'
                        : (group._count?.users || 0) >= group.maxMembers * 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(((group._count?.users || 0) / group.maxMembers) * 100, 100)}%`
                    }}
                  ></div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Link
                    to={`/family-groups/${group.uuid}`}
                    className="flex-1 btn-secondary space-x-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Ver</span>
                  </Link>
                  <Link
                    to={`/family-groups/${group.uuid}/edit`}
                    className="flex-1 btn-primary space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Editar</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(group.uuid)}
                    className="btn-danger px-3"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyGroups;
