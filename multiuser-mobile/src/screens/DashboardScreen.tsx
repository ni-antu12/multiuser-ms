import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { FamilyGroup, Leader } from '../types';
import { apiService } from '../services/api';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import LoadingScreen from '../components/LoadingScreen';
import ErrorMessage from '../components/ErrorMessage';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [groupsData, leadersData] = await Promise.all([
        apiService.getAllFamilyGroups(),
        apiService.getAllLeaders(),
      ]);
      setFamilyGroups(groupsData);
      setLeaders(leadersData);
    } catch (err) {
      setError('Error al cargar los datos del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const totalMembers = familyGroups.reduce(
    (total, group) => total + (group._count?.users || 0),
    0
  );

  const activeLeaders = leaders.filter((leader) => leader.isActive).length;

  const completeGroups = familyGroups.filter(
    (group) => (group._count?.users || 0) >= group.maxMembers
  ).length;

  const recentGroups = [...familyGroups]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  if (error && !refreshing) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary[600]}
          colors={[Colors.primary[600]]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Sistema de grupos familiares</Text>
        </View>
        <View style={styles.connectionStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>API Conectada</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <StatCard
          title="Grupos Familiares"
          value={familyGroups.length}
          icon="people"
          color={Colors.primary[500]}
          onPress={() => navigation.navigate('FamilyGroupsTab' as never)}
        />
        <StatCard
          title="Líderes Activos"
          value={activeLeaders}
          icon="person-circle"
          color={Colors.success[500]}
          onPress={() => navigation.navigate('LeadersTab' as never)}
        />
        <StatCard
          title="Total Miembros"
          value={totalMembers}
          icon="trending-up"
          color="#9333EA"
        />
        <StatCard
          title="Grupos Completos"
          value={completeGroups}
          icon="checkmark-circle"
          color={Colors.warning[500]}
        />
      </View>

      {/* Recent Groups */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Grupos Recientes</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FamilyGroupsTab' as never)}
          >
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {recentGroups.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No hay grupos familiares</Text>
          </Card>
        ) : (
          recentGroups.map((group) => (
            <Card key={group.uuid} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                  <Ionicons name="people" size={20} color={Colors.primary[600]} />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupTitle}>Grupo {group.uuid.slice(0, 8)}</Text>
                  <Text style={styles.groupSubtitle}>
                    {group._count?.users || 0} / {group.maxMembers} miembros
                  </Text>
                </View>
              </View>
              <View style={styles.groupFooter}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.gray[400]} />
                  <Text style={styles.dateText}>
                    {new Date(group.createdAt).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((group._count?.users || 0) / group.maxMembers) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.medical[50] }]}
          onPress={() => navigation.navigate('MedicalCenterTab' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.medical[500] }]}>
            <Ionicons name="medical" size={24} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Centro Médico</Text>
            <Text style={styles.actionSubtitle}>Crear grupo automático</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.primary[50] }]}
          onPress={() => navigation.navigate('FamilyGroupsTab' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.primary[500] }]}>
            <Ionicons name="people" size={24} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Gestión Manual</Text>
            <Text style={styles.actionSubtitle}>Administrar grupos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.success[50] }]}
          onPress={() => navigation.navigate('LeadersTab' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.success[500] }]}>
            <Ionicons name="person-circle" size={24} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Líderes</Text>
            <Text style={styles.actionSubtitle}>Administrar líderes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success[500],
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary[600],
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    padding: 16,
  },
  groupCard: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  groupSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  groupFooter: {
    gap: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});

export default DashboardScreen;

