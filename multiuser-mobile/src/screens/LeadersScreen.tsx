import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { Leader } from '../types';
import { apiService } from '../services/api';
import Card from '../components/Card';
import LoadingScreen from '../components/LoadingScreen';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Input from '../components/Input';

const LeadersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaders = async () => {
    try {
      setError(null);
      const data = await apiService.getAllLeaders();
      setLeaders(data);
      setFilteredLeaders(data);
    } catch (err) {
      setError('Error al cargar los líderes');
      console.error('Leaders error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeaders();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLeaders(leaders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = leaders.filter(
        (leader) =>
          leader.rut.toLowerCase().includes(query) ||
          leader.email.toLowerCase().includes(query) ||
          leader.username.toLowerCase().includes(query) ||
          `${leader.firstName} ${leader.lastName}`.toLowerCase().includes(query)
      );
      setFilteredLeaders(filtered);
    }
  }, [searchQuery, leaders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaders();
  }, []);

  const handleCreateLeader = () => {
    navigation.navigate('CreateLeader' as never);
  };

  const handleDeleteLeader = (uuid: string, name: string) => {
    Alert.alert(
      'Eliminar Líder',
      `¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteLeader(uuid);
              Alert.alert('Éxito', 'Líder eliminado correctamente');
              fetchLeaders();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el líder');
              console.error('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando líderes..." />;
  }

  if (error && !refreshing) {
    return <ErrorMessage message={error} onRetry={fetchLeaders} />;
  }

  if (leaders.length === 0 && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="person-circle-outline"
          title="No hay líderes"
          message="Comienza agregando tu primer líder"
          actionLabel="Crear Líder"
          onAction={handleCreateLeader}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar por RUT, nombre o email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
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
        <View style={styles.header}>
          <Text style={styles.count}>
            {filteredLeaders.length} {filteredLeaders.length === 1 ? 'Líder' : 'Líderes'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>
                Activos: {leaders.filter((l) => l.isActive).length}
              </Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeInactive]}>
              <Text style={styles.statBadgeText}>
                Inactivos: {leaders.filter((l) => !l.isActive).length}
              </Text>
            </View>
          </View>
        </View>

        {filteredLeaders.map((leader) => (
          <Card key={leader.uuid} style={styles.leaderCard}>
            <View style={styles.leaderHeader}>
              <View style={styles.leaderAvatar}>
                <Text style={styles.leaderInitial}>
                  {leader.firstName?.charAt(0) || leader.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.leaderInfo}>
                <View style={styles.leaderTitleRow}>
                  <Text style={styles.leaderName}>
                    {leader.firstName && leader.lastName
                      ? `${leader.firstName} ${leader.lastName}`
                      : leader.username}
                  </Text>
                  {leader.isActive ? (
                    <View style={styles.activeBadge}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>Activo</Text>
                    </View>
                  ) : (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveText}>Inactivo</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.leaderDetail}>RUT: {leader.rut}</Text>
                <Text style={styles.leaderDetail}>{leader.email}</Text>
                <Text style={styles.leaderDetail}>@{leader.username}</Text>
              </View>
            </View>

            <View style={styles.leaderFooter}>
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={14} color={Colors.gray[400]} />
                <Text style={styles.dateText}>
                  Creado: {new Date(leader.createdAt).toLocaleDateString('es-ES')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  handleDeleteLeader(
                    leader.uuid,
                    leader.firstName && leader.lastName
                      ? `${leader.firstName} ${leader.lastName}`
                      : leader.username
                  )
                }
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error[600]} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateLeader}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    backgroundColor: Colors.success[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statBadgeInactive: {
    backgroundColor: Colors.gray[100],
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  leaderCard: {
    marginBottom: 12,
  },
  leaderHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  leaderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary[700],
  },
  leaderInfo: {
    flex: 1,
  },
  leaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  leaderDetail: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success[600],
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success[700],
  },
  inactiveBadge: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  leaderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default LeadersScreen;

