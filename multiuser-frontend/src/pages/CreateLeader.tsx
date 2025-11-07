import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  UserCheck,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { CreateLeaderDto } from '../types';
import { apiService } from '../services/api';
import { formatRut } from '../utils/rutFormatter';

const CreateLeader: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateLeaderDto>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rut.trim() || !formData.email.trim()) {
      setError('Todos los campos requeridos deben estar completos');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const result = await apiService.createLeader(formData);
      setSuccess(result.message || 'Líder creado exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/leaders');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el líder');
      console.error('Create leader error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Formatear RUT automáticamente
    if (name === 'rut') {
      const formatted = formatRut(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setFormData(prev => ({
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
            onClick={() => navigate('/leaders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Líder</h1>
            <p className="text-gray-600 mt-1">Completa el formulario para crear un nuevo líder</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Líder</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                RUT *
              </label>
              <input
                type="text"
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                placeholder="12345678-9"
                className="input-field"
                required
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: 12345678-9
              </p>
            </div>

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
                value={formData.firstName}
                onChange={handleInputChange}
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
                  value={formData.lastNamePaterno}
                  onChange={handleInputChange}
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
                  value={formData.lastNameMaterno}
                  onChange={handleInputChange}
                  placeholder="González"
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
                onClick={() => navigate('/leaders')}
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
                    <span>Crear Líder</span>
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
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Información del Líder</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">RUT:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {formData.rut || 'No especificado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm text-gray-900">
                    {formData.email || 'No especificado'}
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
                    El RUT y email deben ser únicos en el sistema. Asegúrate de que no existan previamente.
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

export default CreateLeader;

