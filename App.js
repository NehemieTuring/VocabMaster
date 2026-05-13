import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import AddWordScreen from './src/screens/AddWordScreen';
import QuizScreen from './src/screens/QuizScreen';
import AIExerciseScreen from './src/screens/AIExerciseScreen';
import { loadFullDictionary } from './src/ai/dictionary';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#1565C0',
  textLight: '#9CA3AF',
  surface: '#FFFFFF',
  background: '#F5F7FA',
  accent: '#FF6D00',
  aiPurple: '#7C3AED',
};

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Vocabulaire') iconName = 'menu-book';
          else if (route.name === 'Ajouter') iconName = 'add-circle';
          else if (route.name === 'Quiz') iconName = 'school';
          else if (route.name === 'IA') iconName = 'auto-awesome';
          const isAI = route.name === 'IA';
          return (
            <View style={focused ? [styles.activeIconWrap, isAI && styles.activeIconWrapAI] : null}>
              <MaterialIcons name={iconName} size={focused ? 26 : 24} color={isAI && focused ? COLORS.aiPurple : color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          ...styles.tabBar,
          // Use the device's bottom safe area inset (for gesture bar / nav buttons)
          // with a minimum padding to ensure it looks good on all devices
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom, 8),
        },
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
      <Tab.Screen
        name="IA"
        component={AIExerciseScreen}
        options={{ tabBarLabel: 'IA', tabBarActiveTintColor: COLORS.aiPurple }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    loadFullDictionary();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
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
  activeIconWrapAI: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
});
