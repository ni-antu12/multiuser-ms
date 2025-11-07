import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MedicalCenterScreen from '../screens/MedicalCenterScreen';
import Colors from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function MedicalCenterStack() {
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
        name="MedicalCenter" 
        component={MedicalCenterScreen}
        options={{ title: 'Centro Médico' }}
      />
    </Stack.Navigator>
  );
}

