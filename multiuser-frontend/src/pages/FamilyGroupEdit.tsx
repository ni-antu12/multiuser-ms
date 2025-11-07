import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { FamilyGroup, UpdateFamilyGroupDto } from '../types';
import { apiService } from '../services/api';

const FamilyGroupEdit: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [formData, setFormData] = useState<UpdateFamilyGroupDto>({
    leader: '',
    tokenApp: '',
    maxMembers: 8
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchFamilyGroup = async () => {
      if (!uuid) return;
      
      try {
        setIsLoading(true);
        const groupData = await apiService.findFamilyGroupByUuid(uuid);
        setFamilyGroup(groupData);
        setFormData({
          leader: groupData.leader,
          tokenApp: groupData.tokenApp,
          maxMembers: groupData.maxMembers
        });
      } catch (err) {
        setError('Error al cargar los datos del grupo familiar');
        console.error('Family group edit error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyGroup();
  }, [uuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uuid) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await apiService.updateFamilyGroup(uuid, formData);
      setSuccess('Grupo familiar actualizado exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/family-groups/${uuid}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el grupo familiar');
      console.error('Update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxMembers' ? parseInt(value) || 8 : value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !familyGroup) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertCircle className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500 mb-4">{error}</p>
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
            onClick={() => navigate(`/family-groups/${uuid}`)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Grupo {familyGroup?.uuid}</h1>
            <p className="text-gray-600 mt-1">Modifica la información del grupo familiar</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/family-groups/${uuid}`)}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Grupo</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="leader" className="block text-sm font-medium text-gray-700 mb-1">
                UUID del Líder
              </label>
              <input
                type="text"
                id="leader"
                name="leader"
                value={formData.leader}
                onChange={handleInputChange}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                UUID del usuario que será el líder del grupo
              </p>
            </div>

            <div>
              <label htmlFor="tokenApp" className="block text-sm font-medium text-gray-700 mb-1">
                Token de Aplicación
              </label>
              <input
                type="text"
                id="tokenApp"
                name="tokenApp"
                value={formData.tokenApp}
                onChange={handleInputChange}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Token único para identificar el grupo en la aplicación
              </p>
            </div>

            <div>
              <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Miembros
              </label>
              <input
                type="number"
                id="maxMembers"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleInputChange}
                min="1"
                max="20"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Número máximo de miembros que puede tener el grupo (1-20)
              </p>
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
              <h3 className="font-medium text-gray-900 mb-3">Grupo Familiar</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">UUID:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {familyGroup?.uuid}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Líder:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {formData.leader}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Token App:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {formData.tokenApp}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Máx. Miembros:</span>
                  <span className="text-sm text-gray-900">{formData.maxMembers}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Importante</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Al cambiar el líder, asegúrate de que el nuevo líder existe en el sistema y no pertenece a otro grupo.
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

export default FamilyGroupEdit;
