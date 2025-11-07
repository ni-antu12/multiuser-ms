import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FamilyGroupsScreen from '../screens/FamilyGroupsScreen';
import FamilyGroupDetailScreen from '../screens/FamilyGroupDetailScreen';
import CreateFamilyGroupScreen from '../screens/CreateFamilyGroupScreen';
import Colors from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function FamilyGroupsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen 
        name="FamilyGroups" 
        component={FamilyGroupsScreen}
        options={{ title: 'Grupos Familiares' }}
      />
      <Stack.Screen 
        name="FamilyGroupDetail" 
        component={FamilyGroupDetailScreen}
        options={{ title: 'Detalle del Grupo' }}
      />
      <Stack.Screen 
        name="CreateFamilyGroup" 
        component={CreateFamilyGroupScreen}
        options={{ title: 'Crear Grupo' }}
      />
    </Stack.Navigator>
  );
}

