import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UserCheck, 
  Calendar, 
  Edit, 
  Trash2,
  Mail,
  User,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { Leader } from '../types';
import { apiService } from '../services/api';

const LeaderDetail: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [leader, setLeader] = useState<Leader | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeader = async () => {
      if (!uuid) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const leaderData = await apiService.getLeaderByUuid(uuid);
        console.log('🔍 Leader Data:', leaderData);
        setLeader(leaderData);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los datos del líder';
        setError(errorMessage);
        console.error('Leader detail error:', err);
        console.error('Error response:', err.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeader();
  }, [uuid]);

  const handleDelete = async () => {
    if (!leader || !confirm('¿Estás seguro de que quieres eliminar este líder?')) {
      return;
    }

    try {
      await apiService.deleteLeader(leader.uuid);
      navigate('/leaders');
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

  if (error || !leader) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <UserCheck className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500 mb-4">{error || 'Líder no encontrado'}</p>
        <Link to="/leaders" className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Líderes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/leaders')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {leader.firstName} {leader.lastNamePaterno} {leader.lastNameMaterno}
            </h1>
            <p className="text-gray-600 mt-1">Detalles del líder</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/leaders/${leader.uuid}/edit`}
            className="btn-primary space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </Link>
          <button
            onClick={handleDelete}
            className="btn-danger space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Líder */}
        <div className="space-y-6">
          <div className="card h-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">UUID</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {leader.uuid}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">RUT</span>
                <span className="text-sm font-mono text-gray-900">{leader.rut}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nombre Completo</span>
                <span className="text-sm text-gray-900">
                  {leader.firstName || 'N/A'} {leader.lastNamePaterno || ''} {leader.lastNameMaterno || ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{leader.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Estado</span>
                <div className="flex items-center space-x-2">
                  {leader.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
                        Activo
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm px-2 py-1 rounded bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Rol</span>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-primary-600" />
                  <span className="text-sm px-2 py-1 rounded bg-primary-100 text-primary-800">
                    Líder
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Fecha de Creación</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {new Date(leader.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Última Actualización</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {new Date(leader.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Resumen */}
          <div className="card h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
            <div className="space-y-3">
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
                <span className="text-sm text-gray-500">Rol</span>
                <span className="text-sm px-2 py-1 rounded bg-primary-100 text-primary-800">
                  Líder
                </span>
              </div>
              {leader.familyGroupsUuid && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Grupo Familiar</span>
                  <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {leader.familyGroupsUuid}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderDetail;

