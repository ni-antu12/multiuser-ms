import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { FamilyGroup, Leader } from '../types';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [groupsData, leadersData] = await Promise.all([
          apiService.getAllFamilyGroups(),
          apiService.getAllLeaders()
        ]);
        setFamilyGroups(groupsData);
        setLeaders(leadersData);
      } catch (err) {
        setError('Error al cargar los datos del dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      name: 'Grupos Familiares',
      value: familyGroups.length,
      icon: Users,
      color: 'bg-blue-500',
      href: '/family-groups'
    },
    {
      name: 'Líderes Activos',
      value: leaders.filter(leader => leader.isActive).length,
      icon: UserCheck,
      color: 'bg-green-500',
      href: '/leaders'
    },
    {
      name: 'Total Miembros',
      value: familyGroups.reduce((total, group) => total + (group._count?.users || 0), 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/family-groups'
    },
    {
      name: 'Grupos Completos',
      value: familyGroups.filter(group => (group._count?.users || 0) >= group.maxMembers).length,
      icon: CheckCircle,
      color: 'bg-orange-500',
      href: '/family-groups'
    }
  ];

  const recentGroups = familyGroups
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen del sistema de grupos familiares</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/family-groups/new"
            className="btn-primary space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Grupo</span>
          </Link>
          <Link
            to="/leaders/new"
            className="btn-secondary space-x-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>Nuevo Líder</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Grupos Recientes</h3>
            <Link
              to="/family-groups"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay grupos familiares</p>
            ) : (
              recentGroups.map((group) => (
                <div key={group.uuid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Grupo {group.uuid}</p>
                      <p className="text-sm text-gray-500">
                        {group._count?.users || 0} / {group.maxMembers} miembros
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(group.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link
              to="/medical-center"
              className="flex items-center space-x-3 p-3 bg-medical-50 rounded-lg hover:bg-medical-100 transition-colors duration-200"
            >
              <div className="h-10 w-10 bg-medical-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Centro Médico</p>
                <p className="text-sm text-gray-500">Crear grupo automático</p>
              </div>
            </Link>
            
            <Link
              to="/family-groups"
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gestión Manual</p>
                <p className="text-sm text-gray-500">Administrar grupos</p>
              </div>
            </Link>
            
            <Link
              to="/leaders"
              className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Líderes</p>
                <p className="text-sm text-gray-500">Administrar líderes</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
