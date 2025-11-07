import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { CreateFamilyGroupDto, CreateLeaderDto } from '../types';
import { apiService } from '../services/api';
import { formatRut } from '../utils/rutFormatter';

const CreateFamilyGroup: React.FC = () => {
  const navigate = useNavigate();
  const [leaderData, setLeaderData] = useState<CreateLeaderDto>({
    rut: '',
    email: '',
    firstName: '',
    lastNamePaterno: '',
    lastNameMaterno: '',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaderData.rut.trim() || !leaderData.email.trim()) {
      setError('Todos los campos requeridos del líder deben estar completos');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Paso 1: Crear el líder
      const leaderResult = await apiService.createLeader(leaderData);
      const leaderUuid = leaderResult.leader.uuid;
      
      // Paso 2: Crear el grupo familiar automáticamente con valores por defecto
      const groupData: CreateFamilyGroupDto = {
        leader: leaderUuid,
        tokenApp: '', // Se generará automáticamente
        maxMembers: 8 // Valor por defecto
      };
      
      await apiService.createFamilyGroup(groupData);
      
      setSuccess('Líder y grupo familiar creados exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/family-groups');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el líder y el grupo familiar');
      console.error('Create leader/group error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleLeaderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Formatear RUT automáticamente
    if (name === 'rut') {
      const formatted = formatRut(value);
      setLeaderData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setLeaderData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/family-groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Grupo Familiar</h1>
            <p className="text-gray-600 mt-1">
              Crea el líder y el grupo familiar en un solo paso
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leader Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Líder</h2>
            
            <form onSubmit={handleLeaderSubmit} className="space-y-4">
              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  id="rut"
                  name="rut"
                  value={leaderData.rut}
                  onChange={handleLeaderInputChange}
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
                  value={leaderData.email}
                  onChange={handleLeaderInputChange}
                  placeholder="lider@ejemplo.com"
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
                  value={leaderData.firstName}
                  onChange={handleLeaderInputChange}
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
                  value={leaderData.lastNamePaterno}
                  onChange={handleLeaderInputChange}
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
                  value={leaderData.lastNameMaterno}
                  onChange={handleLeaderInputChange}
                  placeholder="González"
                  className="input-field"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/family-groups')}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1 space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Crear Grupo Familiar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        {/* Preview */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Líder</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">RUT:</span>
                  <span className="text-sm font-mono">{leaderData.rut || 'No especificado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm">{leaderData.email || 'No especificado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Nombre Completo:</span>
                  <span className="text-sm">{leaderData.firstName || 'N/A'} {leaderData.lastNamePaterno || ''} {leaderData.lastNameMaterno || ''}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFamilyGroup;
