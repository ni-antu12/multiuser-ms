import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeadersScreen from '../screens/LeadersScreen';
import CreateLeaderScreen from '../screens/CreateLeaderScreen';
import Colors from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function LeadersStack() {
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
        name="Leaders" 
        component={LeadersScreen}
        options={{ title: 'Líderes' }}
      />
      <Stack.Screen 
        name="CreateLeader" 
        component={CreateLeaderScreen}
        options={{ title: 'Crear Líder' }}
      />
    </Stack.Navigator>
  );
}

