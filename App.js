import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import AddWordScreen from './src/screens/AddWordScreen';
import QuizScreen from './src/screens/QuizScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#1565C0',
  textLight: '#9CA3AF',
  surface: '#FFFFFF',
  background: '#F5F7FA',
  accent: '#FF6D00',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Vocabulaire') iconName = 'menu-book';
              else if (route.name === 'Ajouter') iconName = 'add-circle';
              else if (route.name === 'Quiz') iconName = 'school';
              return (
                <View style={focused ? styles.activeIconWrap : null}>
                  <MaterialIcons name={iconName} size={focused ? 26 : 24} color={color} />
                </View>
              );
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
            tabBarItemStyle: styles.tabItem,
          })}
        >
          <Tab.Screen
            name="Vocabulaire"
            component={HomeScreen}
            options={{ tabBarLabel: 'Mes mots' }}
          />
          <Tab.Screen
            name="Ajouter"
            component={AddWordScreen}
            options={{ tabBarLabel: 'Ajouter' }}
          />
          <Tab.Screen
            name="Quiz"
            component={QuizScreen}
            options={{ tabBarLabel: "S'exercer" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 70,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
  activeIconWrap: {
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
