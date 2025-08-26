import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Image, Button, ActivityIndicator, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PendingCountProvider, usePendingCount } from './src/context/PendingCountContext';
import LoginScreen from './src/screens/LoginScreen';
import TakvimScreen from './src/screens/TakvimScreen';
import IzinlerimScreen from './src/screens/IzinlerimScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import BekleyenOnaylarScreen from './src/screens/BekleyenOnaylarScreen';
import EkipAyarScreen from './src/screens/EkipAyarScreen';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getBackendUrl, API } from './src/config/config';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Kurumsal tema renkleri
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976d2',
    background: '#f5f7fa',
    card: '#fff',
    text: '#222',
    border: '#e0e0e0',
    notification: '#1976d2',
  },
};

// ProfilScreen fonksiyonu kaldırıldı

function PersonelTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="Takvim"
      screenOptions={{
        tabBarStyle: { 
          elevation: 0, 
          shadowOpacity: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tab.Screen 
        name="Takvim" 
        component={TakvimScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="İzinlerim" 
        component={IzinlerimScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-available" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfilScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AmirTabs() {
  const { user } = useAuth();
  const { pendingCount, updatePendingCount } = usePendingCount();

  const fetchPendingCount = async () => {
    try {
      const res = await axios.get(getBackendUrl(API.LEAVES.PENDING), {
        headers: { Authorization: user.token },
      });
      updatePendingCount(res.data.length);
    } catch (e) {
      console.log('Bekleyen onay sayısı alınamadı');
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchPendingCount();
      // Her 30 saniyede bir güncelle
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.token]);

  return (
    <Tab.Navigator 
      initialRouteName="BekleyenOnaylar"
      screenOptions={{
        tabBarStyle: { 
          elevation: 0, 
          shadowOpacity: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tab.Screen 
        name="Bekleyen Onaylar" 
        component={BekleyenOnaylarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <MaterialIcons name="pending-actions" color={color} size={size} />
              {pendingCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -8,
                  backgroundColor: '#f44336',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#fff',
                }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => {
            // Tab'a tıklandığında sayıyı güncelle
            fetchPendingCount();
          },
        }}
      />
      <Tab.Screen 
        name="Ekipler" 
        component={EkipAyarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfilScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }
  if (user.role === 'admin') {
    return <AmirTabs />;
  }
  return <PersonelTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <PendingCountProvider>
        <NavigationContainer theme={theme}>
          <RootNavigator />
        </NavigationContainer>
      </PendingCountProvider>
    </AuthProvider>
  );
}
