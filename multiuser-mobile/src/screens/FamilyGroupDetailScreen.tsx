import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { FamilyGroup, User } from '../types';
import { apiService } from '../services/api';
import Card from '../components/Card';
import LoadingScreen from '../components/LoadingScreen';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';

type RouteParams = {
  uuid: string;
};

const FamilyGroupDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation();
  const { uuid } = route.params;

  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      setError(null);
      const [groupData, membersData] = await Promise.all([
        apiService.getFamilyGroupByUuid(uuid),
        apiService.getFamilyGroupMembers(uuid),
      ]);
      setFamilyGroup(groupData);
      setMembers(membersData);
    } catch (err) {
      setError('Error al cargar los detalles del grupo');
      console.error('FamilyGroupDetail error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [uuid]);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Grupo',
      '¿Estás seguro de que deseas eliminar este grupo familiar? Esta acción no se puede deshacer.',
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
              setIsDeleting(true);
              await apiService.deleteFamilyGroup(uuid);
              Alert.alert('Éxito', 'Grupo eliminado correctamente');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el grupo');
              console.error('Delete error:', err);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando detalles..." />;
  }

  if (error || !familyGroup) {
    return <ErrorMessage message={error || 'Grupo no encontrado'} onRetry={fetchGroupDetails} />;
  }

  const memberCount = members.length;
  const percentage = (memberCount / familyGroup.maxMembers) * 100;
  const isFull = memberCount >= familyGroup.maxMembers;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={48} color={Colors.primary[600]} />
        </View>
        <Text style={styles.title}>Grupo {familyGroup.uuid.slice(0, 8)}</Text>
        <Text style={styles.subtitle}>UUID: {familyGroup.uuid}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{memberCount}</Text>
            <Text style={styles.statLabel}>Miembros</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{familyGroup.maxMembers}</Text>
            <Text style={styles.statLabel}>Máximo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{percentage.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Ocupación</Text>
          </View>
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

        {isFull && (
          <View style={styles.fullBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success[600]} />
            <Text style={styles.fullText}>Grupo Completo</Text>
          </View>
        )}
      </Card>

      {/* Info Card */}
      <Card>
        <Text style={styles.cardTitle}>Información</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="key-outline" size={20} color={Colors.gray[400]} />
          <Text style={styles.infoLabel}>Token:</Text>
          <Text style={styles.infoValue}>{familyGroup.tokenApp || 'Sin token'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color={Colors.gray[400]} />
          <Text style={styles.infoLabel}>Líder:</Text>
          <Text style={styles.infoValue}>{familyGroup.leader}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={Colors.gray[400]} />
          <Text style={styles.infoLabel}>Creado:</Text>
          <Text style={styles.infoValue}>
            {new Date(familyGroup.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </Card>

      {/* Members Card */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Miembros ({memberCount})</Text>
        </View>

        {members.length === 0 ? (
          <View style={styles.emptyMembers}>
            <Ionicons name="people-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No hay miembros en este grupo</Text>
          </View>
        ) : (
          members.map((member, index) => (
            <View key={member.uuid}>
              {index > 0 && <View style={styles.memberDivider} />}
              <View style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {member.firstName?.charAt(0) || member.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.firstName && member.lastName
                      ? `${member.firstName} ${member.lastName}`
                      : member.username}
                  </Text>
                  <Text style={styles.memberDetail}>RUT: {member.rut}</Text>
                  <Text style={styles.memberDetail}>{member.email}</Text>
                </View>
                {member.isLeader && (
                  <View style={styles.leaderBadge}>
                    <Ionicons name="star" size={12} color={Colors.warning[600]} />
                    <Text style={styles.leaderText}>Líder</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Eliminar Grupo"
          onPress={handleDelete}
          variant="danger"
          loading={isDeleting}
        />
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
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fullText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success[700],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary[700],
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  memberDetail: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning[700],
  },
  actionsContainer: {
    marginTop: 8,
  },
});

export default FamilyGroupDetailScreen;

