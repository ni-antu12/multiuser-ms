import React, { useState } from 'react';
import { 
  Activity, 
  User, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import { formatRut } from '../utils/rutFormatter';

const MedicalCenter: React.FC = () => {
  const [userRut, setUserRut] = useState('');
  const [tokenApp, setTokenApp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRut.trim()) {
      setError('El RUT es requerido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const data = await apiService.createMyFamilyGroup(userRut.trim(), {
        tokenApp: tokenApp.trim() || undefined
      });

      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el grupo familiar');
      console.error('Medical center error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUserRut('');
    setTokenApp('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro Médico</h1>
          <p className="text-gray-600 mt-1">Crear grupo familiar automático para pacientes</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-medical-600">
          <Activity className="h-4 w-4" />
          <span>Flujo Automático</span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">¿Cómo funciona?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Este flujo está diseñado para centros médicos. El sistema automáticamente:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Obtiene los datos del paciente desde la BD del centro médico</li>
              <li>• Valida que el paciente sea mayor de 18 años</li>
              <li>• Verifica que no pertenezca a otro grupo familiar</li>
              <li>• Crea el usuario líder y el grupo familiar</li>
              <li>• Asocia automáticamente al líder como primer miembro</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear Grupo Familiar</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="userRut" className="block text-sm font-medium text-gray-700 mb-1">
                RUT del Paciente *
              </label>
              <input
                type="text"
                id="userRut"
                value={userRut}
                onChange={(e) => setUserRut(formatRut(e.target.value))}
                placeholder="12345678-9"
                className="input-field"
                required
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                RUT del paciente autenticado (obtenido del token de sesión)
              </p>
            </div>

            <div>
              <label htmlFor="tokenApp" className="block text-sm font-medium text-gray-700 mb-1">
                Token de Aplicación (Opcional)
              </label>
              <input
                type="text"
                id="tokenApp"
                value={tokenApp}
                onChange={(e) => setTokenApp(e.target.value)}
                placeholder="mi_token_personalizado"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no se proporciona, se genera automáticamente
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
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
                    <Activity className="h-4 w-4" />
                    <span>Crear Grupo</span>
                  </>
                )}
              </button>
              
              {result && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Nuevo Grupo
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Result */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultado</h2>
          
          {!result && !error && (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">Ingresa el RUT del paciente para crear el grupo</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800">{result.message}</p>
                </div>
              </div>

              {/* Group Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Grupo Familiar Creado</h3>
                
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">UUID:</span>
                    <span className="text-sm font-mono text-gray-900">{result.familyGroup.uuid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Token App:</span>
                    <span className="text-sm font-mono text-gray-900">{result.familyGroup.tokenApp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Máx. Miembros:</span>
                    <span className="text-sm text-gray-900">{result.familyGroup.maxMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Creado:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(result.familyGroup.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Líder Asignado</h3>
                
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">UUID:</span>
                    <span className="text-sm font-mono text-gray-900">{result.user.uuid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">RUT:</span>
                    <span className="text-sm text-gray-900">{result.user.rut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="text-sm text-gray-900">{result.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Nombre:</span>
                    <span className="text-sm text-gray-900">
                      {result.user.firstName} {result.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Username:</span>
                    <span className="text-sm text-gray-900">{result.user.username}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalCenter;
