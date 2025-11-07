import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Leader, UpdateLeaderDto } from '../types';
import { apiService } from '../services/api';

const LeaderEdit: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [leader, setLeader] = useState<Leader | null>(null);
  const [formData, setFormData] = useState<UpdateLeaderDto>({
    email: '',
    firstName: '',
    lastNamePaterno: '',
    lastNameMaterno: '',
    isActive: true
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeader = async () => {
      if (!uuid) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const leaderData = await apiService.getLeaderByUuid(uuid);
        console.log('🔍 Leader Data:', leaderData);
        setLeader(leaderData);
        setFormData({
          email: leaderData.email,
          firstName: leaderData.firstName || '',
          lastNamePaterno: leaderData.lastNamePaterno || '',
          lastNameMaterno: leaderData.lastNameMaterno || '',
          isActive: leaderData.isActive
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los datos del líder';
        setError(errorMessage);
        console.error('Leader edit error:', err);
        console.error('Error response:', err.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeader();
  }, [uuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uuid) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: UpdateLeaderDto = { ...formData };
      if (password) {
        updateData.password = password;
      }

      await apiService.updateLeader(uuid, updateData);
      setSuccess('Líder actualizado exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/leaders/${uuid}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el líder');
      console.error('Update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !leader) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertCircle className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500 mb-4">{error}</p>
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
            onClick={() => navigate(`/leaders/${uuid}`)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Líder {leader?.firstName} {leader?.lastNamePaterno} {leader?.lastNameMaterno}
            </h1>
            <p className="text-gray-600 mt-1">Modifica la información del líder</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/leaders/${uuid}`)}
            className="btn-secondary space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Cancelar</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Líder</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Email único del líder
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Deja en blanco si no quieres cambiar la contraseña (mínimo 6 caracteres)
              </p>
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
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
                value={formData.lastNamePaterno}
                onChange={handleInputChange}
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
                value={formData.lastNameMaterno}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Líder Activo
              </label>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full space-x-2"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Información del Líder</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">UUID:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {leader?.uuid}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">RUT:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {leader?.rut}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm text-gray-900">
                    {formData.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Nombre Completo:</span>
                  <span className="text-sm text-gray-900">
                    {formData.firstName || 'N/A'} {formData.lastNamePaterno || ''} {formData.lastNameMaterno || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Estado:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    formData.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Importante</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Al cambiar el email, asegúrate de que no esté en uso por otro usuario.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderEdit;

