import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/colors';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const CreateLeaderScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    rut: '',
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({
    rut: '',
    email: '',
    username: '',
    password: '',
  });

  const validateForm = () => {
    const newErrors = {
      rut: '',
      email: '',
      username: '',
      password: '',
    };

    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return !newErrors.rut && !newErrors.email && !newErrors.username && !newErrors.password;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const createData = {
        rut: formData.rut.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        isActive: formData.isActive,
      };

      await apiService.createLeader(createData);

      Alert.alert('Éxito', 'Líder creado correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo crear el líder'
      );
      console.error('Create error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <Input
            label="RUT *"
            placeholder="12345678-9"
            value={formData.rut}
            onChangeText={(text) => setFormData({ ...formData, rut: text })}
            error={errors.rut}
            autoCapitalize="none"
          />

          <Input
            label="Nombre"
            placeholder="Juan"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            autoCapitalize="words"
          />

          <Input
            label="Apellido"
            placeholder="Pérez"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            autoCapitalize="words"
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Credenciales</Text>

          <Input
            label="Email *"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Nombre de Usuario *"
            placeholder="juanperez"
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
            error={errors.username}
            autoCapitalize="none"
            autoComplete="username"
          />

          <Input
            label="Contraseña *"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Estado Activo</Text>
              <Text style={styles.switchDescription}>
                El líder podrá acceder al sistema
              </Text>
            </View>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
              thumbColor={formData.isActive ? Colors.primary[600] : Colors.gray[400]}
            />
          </View>
        </Card>

        <Text style={styles.hint}>* Campos requeridos</Text>

        <View style={styles.actions}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Crear Líder"
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  hint: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default CreateLeaderScreen;

