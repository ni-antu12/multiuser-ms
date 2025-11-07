import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { FamilyGroup } from '../types';
import { apiService } from '../services/api';
import Card from '../components/Card';
import LoadingScreen from '../components/LoadingScreen';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

const FamilyGroupsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilyGroups = async () => {
    try {
      setError(null);
      const data = await apiService.getAllFamilyGroups();
      setFamilyGroups(data);
    } catch (err) {
      setError('Error al cargar los grupos familiares');
      console.error('FamilyGroups error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFamilyGroups();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFamilyGroups();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFamilyGroups();
  }, []);

  const handleGroupPress = (uuid: string) => {
    navigation.navigate('FamilyGroupDetail' as never, { uuid } as never);
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateFamilyGroup' as never);
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando grupos..." />;
  }

  if (error && !refreshing) {
    return <ErrorMessage message={error} onRetry={fetchFamilyGroups} />;
  }

  if (familyGroups.length === 0 && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="people-outline"
          title="No hay grupos familiares"
          message="Comienza creando tu primer grupo familiar"
          actionLabel="Crear Grupo"
          onAction={handleCreateGroup}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            {familyGroups.length} {familyGroups.length === 1 ? 'Grupo' : 'Grupos'}
          </Text>
        </View>

        {familyGroups.map((group) => {
          const memberCount = group._count?.users || 0;
          const percentage = (memberCount / group.maxMembers) * 100;
          const isFull = memberCount >= group.maxMembers;

          return (
            <TouchableOpacity
              key={group.uuid}
              onPress={() => handleGroupPress(group.uuid)}
              activeOpacity={0.7}
            >
              <Card style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupIcon}>
                    <Ionicons name="people" size={24} color={Colors.primary[600]} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupTitle}>Grupo {group.uuid.slice(0, 8)}</Text>
                    <Text style={styles.groupSubtitle}>
                      Token: {group.tokenApp || 'Sin token'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
                </View>

                <View style={styles.groupStats}>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={16} color={Colors.gray[400]} />
                    <Text style={styles.statText}>
                      {memberCount} / {group.maxMembers} miembros
                    </Text>
                  </View>
                  {isFull && (
                    <View style={styles.fullBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success[600]} />
                      <Text style={styles.fullText}>Completo</Text>
                    </View>
                  )}
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: isFull ? Colors.success[500] : Colors.primary[500],
                      },
                    ]}
                  />
                </View>

                <View style={styles.groupFooter}>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.gray[400]} />
                    <Text style={styles.dateText}>
                      Creado: {new Date(group.createdAt).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateGroup}>
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
    width: 48,
    height: 48,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  groupSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fullText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success[700],
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default FamilyGroupsScreen;

