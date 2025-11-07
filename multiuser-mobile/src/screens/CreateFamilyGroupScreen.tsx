import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/colors';
import { Leader } from '../types';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';

const CreateFamilyGroupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaderRut: '',
    tokenApp: '',
    maxMembers: '5',
  });

  const [errors, setErrors] = useState({
    leaderRut: '',
    maxMembers: '',
  });

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const data = await apiService.getAllLeaders();
      setLeaders(data);
    } catch (err) {
      console.error('Error loading leaders:', err);
    } finally {
      setIsLoadingLeaders(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      leaderRut: '',
      maxMembers: '',
    };

    if (!formData.leaderRut.trim()) {
      newErrors.leaderRut = 'El RUT del líder es requerido';
    }

    const maxMembers = parseInt(formData.maxMembers);
    if (!formData.maxMembers || isNaN(maxMembers) || maxMembers < 1) {
      newErrors.maxMembers = 'El número de miembros debe ser mayor a 0';
    }

    setErrors(newErrors);
    return !newErrors.leaderRut && !newErrors.maxMembers;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const createData = {
        leader: formData.leaderRut.trim(),
        tokenApp: formData.tokenApp.trim() || undefined,
        maxMembers: parseInt(formData.maxMembers),
      };

      await apiService.createFamilyGroup(createData);

      Alert.alert(
        'Éxito',
        'Grupo familiar creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo crear el grupo familiar'
      );
      console.error('Create error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingLeaders) {
    return <LoadingScreen message="Cargando..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text style={styles.sectionTitle}>Información del Grupo</Text>
          
          <Input
            label="RUT del Líder *"
            placeholder="12345678-9"
            value={formData.leaderRut}
            onChangeText={(text) => setFormData({ ...formData, leaderRut: text })}
            error={errors.leaderRut}
            autoCapitalize="none"
          />

          {leaders.length > 0 && (
            <View style={styles.leadersHint}>
              <Text style={styles.hintTitle}>Líderes disponibles:</Text>
              {leaders.slice(0, 3).map((leader) => (
                <Text key={leader.uuid} style={styles.hintText}>
                  • {leader.rut} - {leader.firstName} {leader.lastName}
                </Text>
              ))}
              {leaders.length > 3 && (
                <Text style={styles.hintText}>y {leaders.length - 3} más...</Text>
              )}
            </View>
          )}

          <Input
            label="Token de la App (Opcional)"
            placeholder="token-app-ejemplo"
            value={formData.tokenApp}
            onChangeText={(text) => setFormData({ ...formData, tokenApp: text })}
            autoCapitalize="none"
          />

          <Input
            label="Número Máximo de Miembros *"
            placeholder="5"
            value={formData.maxMembers}
            onChangeText={(text) => setFormData({ ...formData, maxMembers: text })}
            error={errors.maxMembers}
            keyboardType="number-pad"
          />

          <Text style={styles.hint}>
            * Campos requeridos
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Crear Grupo"
            onPress={handleSubmit}
            variant="primary"
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  leadersHint: {
    backgroundColor: Colors.primary[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: Colors.primary[600],
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default CreateFamilyGroupScreen;

