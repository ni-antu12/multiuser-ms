import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const MedicalCenterScreen: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    userRut: '',
    tokenApp: '',
  });

  const [errors, setErrors] = useState({
    userRut: '',
  });

  const validateForm = () => {
    const newErrors = {
      userRut: '',
    };

    if (!formData.userRut.trim()) {
      newErrors.userRut = 'El RUT del usuario es requerido';
    }

    setErrors(newErrors);
    return !newErrors.userRut;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      const data = formData.tokenApp.trim()
        ? { tokenApp: formData.tokenApp.trim() }
        : undefined;

      const response = await apiService.createMyFamilyGroup(formData.userRut.trim(), data);

      setResult(response);

      Alert.alert(
        '¡Éxito!',
        'Grupo familiar creado automáticamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar formulario
              setFormData({
                userRut: '',
                tokenApp: '',
              });
            },
          },
        ]
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        'No se pudo crear el grupo familiar automáticamente';

      Alert.alert('Error', errorMessage);
      console.error('Create my family group error:', err);
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
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={48} color={Colors.medical[600]} />
          </View>
          <Text style={styles.headerTitle}>Centro Médico</Text>
          <Text style={styles.headerSubtitle}>
            Creación automática de grupo familiar
          </Text>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.primary[600]} />
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          </View>
          <Text style={styles.infoText}>
            Este flujo está diseñado para centros médicos. Al ingresar el RUT de un usuario:
          </Text>
          <View style={styles.infoList}>
            <Text style={styles.infoListItem}>
              1. Se verifica si el usuario ya existe
            </Text>
            <Text style={styles.infoListItem}>
              2. Si no existe, se crea automáticamente
            </Text>
            <Text style={styles.infoListItem}>
              3. Si no tiene grupo, se crea uno nuevo
            </Text>
            <Text style={styles.infoListItem}>
              4. El usuario se convierte en líder del grupo
            </Text>
          </View>
        </Card>

        {/* Form Card */}
        <Card>
          <Text style={styles.sectionTitle}>Datos del Usuario</Text>

          <Input
            label="RUT del Usuario *"
            placeholder="12345678-9"
            value={formData.userRut}
            onChangeText={(text) => setFormData({ ...formData, userRut: text })}
            error={errors.userRut}
            autoCapitalize="none"
          />

          <Input
            label="Token de la App (Opcional)"
            placeholder="token-app-ejemplo"
            value={formData.tokenApp}
            onChangeText={(text) => setFormData({ ...formData, tokenApp: text })}
            autoCapitalize="none"
          />

          <Text style={styles.hint}>
            * El sistema creará automáticamente el usuario y su grupo familiar si no existen
          </Text>

          <Button
            title="Crear Grupo Automático"
            onPress={handleSubmit}
            variant="primary"
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </Card>

        {/* Result Card */}
        {result && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.success[600]} />
              <Text style={styles.resultTitle}>¡Grupo Creado!</Text>
            </View>

            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>Usuario</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>RUT:</Text>
                <Text style={styles.resultValue}>{result.user.rut}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Email:</Text>
                <Text style={styles.resultValue}>{result.user.email}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Usuario:</Text>
                <Text style={styles.resultValue}>{result.user.username}</Text>
              </View>
              {result.user.firstName && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Nombre:</Text>
                  <Text style={styles.resultValue}>
                    {result.user.firstName} {result.user.lastName}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>Grupo Familiar</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>UUID:</Text>
                <Text style={styles.resultValue} numberOfLines={1}>
                  {result.familyGroup.uuid}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Token:</Text>
                <Text style={styles.resultValue}>
                  {result.familyGroup.tokenApp || 'Sin token'}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Máx. Miembros:</Text>
                <Text style={styles.resultValue}>{result.familyGroup.maxMembers}</Text>
              </View>
            </View>

            <View style={styles.resultMessageContainer}>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          </Card>
        )}

        {/* Warning Card */}
        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color={Colors.warning[600]} />
            <Text style={styles.warningTitle}>Importante</Text>
          </View>
          <Text style={styles.warningText}>
            Este flujo es exclusivo para centros médicos y requiere que el usuario ya esté
            registrado en el sistema de formularios. Si el usuario no existe, será creado
            automáticamente con información básica.
          </Text>
        </Card>
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
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.medical[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.primary[50],
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary[700],
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary[700],
    marginBottom: 12,
    lineHeight: 20,
  },
  infoList: {
    gap: 6,
  },
  infoListItem: {
    fontSize: 14,
    color: Colors.primary[600],
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: Colors.success[50],
    borderColor: Colors.success[200],
    borderWidth: 1,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success[700],
    marginTop: 8,
  },
  resultSection: {
    marginBottom: 12,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    width: 100,
  },
  resultValue: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.success[200],
    marginVertical: 12,
  },
  resultMessageContainer: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: Colors.success[700],
    textAlign: 'center',
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: Colors.warning[50],
    borderColor: Colors.warning[200],
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warning[700],
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning[700],
    lineHeight: 20,
  },
});

export default MedicalCenterScreen;

