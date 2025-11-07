import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Edit, 
  Trash2,
  Copy,
  UserPlus,
  Shield
} from 'lucide-react';
import type { FamilyGroup, User } from '../types';
import { apiService } from '../services/api';
import { formatRut } from '../utils/rutFormatter';

const FamilyGroupDetail: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberRut, setMemberRut] = useState('');

  useEffect(() => {
    const fetchFamilyGroup = async () => {
      if (!uuid) return;
      
      try {
        setIsLoading(true);
        const groupData = await apiService.findFamilyGroupByUuid(uuid);
        console.log('🔍 Group Data:', groupData);
        setFamilyGroup(groupData);
        setMembers(groupData.users || []);
      } catch (err) {
        setError('Error al cargar los datos del grupo familiar');
        console.error('Family group detail error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyGroup();
  }, [uuid]);

  const handleDelete = async () => {
    if (!familyGroup || !confirm('¿Estás seguro de que quieres eliminar este grupo familiar?')) {
      return;
    }

    try {
      await apiService.deleteFamilyGroup(familyGroup.uuid);
      navigate('/family-groups');
    } catch (err) {
      setError('Error al eliminar el grupo familiar');
      console.error('Delete error:', err);
    }
  };

  const handleCopyToken = () => {
    if (familyGroup) {
      navigator.clipboard.writeText(familyGroup.tokenApp);
      // Aquí podrías agregar una notificación de éxito
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!familyGroup) return;

    const formData = new FormData(e.currentTarget);
    const memberData = {
      rut: memberRut || (formData.get('rut') as string),
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string || undefined,
      lastNamePaterno: formData.get('lastNamePaterno') as string || undefined,
      lastNameMaterno: formData.get('lastNameMaterno') as string || undefined,
    };

    try {
      await apiService.addMemberToFamilyGroup(familyGroup.uuid, memberData);
      setShowAddMemberModal(false);
      setMemberRut(''); // Reset RUT field
      // Recargar los datos del grupo
      const groupData = await apiService.findFamilyGroupByUuid(familyGroup.uuid);
      setFamilyGroup(groupData);
      setMembers(groupData.users || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar el miembro');
      console.error('Add member error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !familyGroup) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Users className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500 mb-4">{error || 'Grupo familiar no encontrado'}</p>
        <Link to="/family-groups" className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Grupos
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
            onClick={() => navigate('/family-groups')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grupo {familyGroup.uuid}</h1>
            <p className="text-gray-600 mt-1">Detalles del grupo familiar</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="btn-secondary space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Añadir Miembro</span>
          </button>
          <Link
            to={`/family-groups/${familyGroup.uuid}/edit`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Grupo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Grupo</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">UUID del Grupo</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {familyGroup.uuid}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Líder</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {familyGroup.leader}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Token de Aplicación</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {familyGroup.tokenApp}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Copiar token"
                  >
                    <Copy className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Máximo de Miembros</span>
                <span className="text-sm font-medium text-gray-900">{familyGroup.maxMembers}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Fecha de Creación</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {new Date(familyGroup.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Miembros del Grupo */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Miembros del Grupo</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {members.length} / {familyGroup.maxMembers}
                </span>
                <button className="p-1 hover:bg-gray-100 rounded" title="Agregar miembro">
                  <UserPlus className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay miembros</h3>
                <p className="mt-1 text-sm text-gray-500">Este grupo no tiene miembros registrados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.uuid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        {member.isLeader ? (
                          <Shield className="h-4 w-4 text-primary-600" />
                        ) : (
                          <Users className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.rut} • {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.isLeader && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          Líder
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total de Miembros</span>
                <span className="text-sm font-medium text-gray-900">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Capacidad</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((members.length / familyGroup.maxMembers) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Líderes</span>
                <span className="text-sm font-medium text-gray-900">
                  {members.filter(m => m.isLeader).length}
                </span>
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Miembros</span>
                <span className="text-sm font-medium text-gray-900">
                  {members.length} / {familyGroup.maxMembers}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    members.length >= familyGroup.maxMembers
                      ? 'bg-red-500'
                      : members.length >= familyGroup.maxMembers * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((members.length / familyGroup.maxMembers) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para añadir miembro */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Añadir Miembro</h2>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  id="rut"
                  name="rut"
                  value={memberRut}
                  onChange={(e) => setMemberRut(formatRut(e.target.value))}
                  placeholder="12345678-9"
                  className="input-field"
                  required
                  maxLength={10}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="miembro@ejemplo.com"
                  className="input-field"
                  required
                />
              </div>


              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Juan"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="lastNamePaterno" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno
                </label>
                <input
                  type="text"
                  id="lastNamePaterno"
                  name="lastNamePaterno"
                  placeholder="Pérez"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="lastNameMaterno" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  id="lastNameMaterno"
                  name="lastNameMaterno"
                  placeholder="González"
                  className="input-field"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Añadir Miembro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyGroupDetail;
