import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

// Stack Navigators
import DashboardStack from './DashboardStack';
import FamilyGroupsStack from './FamilyGroupsStack';
import LeadersStack from './LeadersStack';
import MedicalCenterStack from './MedicalCenterStack';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FamilyGroupsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'LeadersTab') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'MedicalCenterTab') {
            iconName = focused ? 'medical' : 'medical-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStack}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen 
        name="FamilyGroupsTab" 
        component={FamilyGroupsStack}
        options={{ tabBarLabel: 'Grupos' }}
      />
      <Tab.Screen 
        name="LeadersTab" 
        component={LeadersStack}
        options={{ tabBarLabel: 'Líderes' }}
      />
      <Tab.Screen 
        name="MedicalCenterTab" 
        component={MedicalCenterStack}
        options={{ tabBarLabel: 'Médico' }}
      />
    </Tab.Navigator>
  );
}

