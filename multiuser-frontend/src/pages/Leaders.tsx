import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  UserCheck, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import type { Leader } from '../types';
import { apiService } from '../services/api';

const Leaders: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getAllLeaders(searchTerm);
        setLeaders(data);
      } catch (err) {
        setError('Error al cargar los líderes');
        console.error('Leaders error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaders();
  }, [searchTerm]);

  // La búsqueda se hace en el backend, no necesitamos filtrar aquí
  const filteredLeaders = leaders;

  const handleDelete = async (uuid: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este líder?')) {
      return;
    }

    try {
      await apiService.deleteLeader(uuid);
      setLeaders(leaders => leaders.filter(leader => leader.uuid !== uuid));
    } catch (err) {
      setError('Error al eliminar el líder');
      console.error('Delete error:', err);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Líderes</h1>
          <p className="text-gray-600 mt-1">Administra los líderes del sistema</p>
        </div>
        <Link
          to="/leaders/new"
          className="btn-primary space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Líder</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por UUID, RUT, email o nombre..."
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

      {/* Leaders Grid */}
      {filteredLeaders.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay líderes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron líderes que coincidan con la búsqueda.' : 'Comienza creando un nuevo líder.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/leaders/new"
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Líder
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaders.map((leader) => (
            <div key={leader.uuid} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {leader.firstName} {leader.lastNamePaterno} {leader.lastNameMaterno}
                    </h3>
                    <p className="text-sm text-gray-500">{leader.email}</p>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">RUT</span>
                  <span className="text-sm font-mono text-gray-900">{leader.rut}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm text-gray-900 truncate max-w-32">{leader.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">UUID</span>
                  <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {leader.uuid}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estado</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    leader.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {leader.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Creado</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(leader.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Link
                    to={`/leaders/${leader.uuid}`}
                    className="flex-1 btn-secondary space-x-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Ver</span>
                  </Link>
                  <Link
                    to={`/leaders/${leader.uuid}/edit`}
                    className="flex-1 btn-primary space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Editar</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(leader.uuid)}
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

export default Leaders;
