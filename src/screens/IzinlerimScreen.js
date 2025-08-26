import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';

export default function IzinlerimScreen() {
  const { user } = useAuth();
  const [izinler, setIzinler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [remainingDays, setRemainingDays] = useState(null);

  const fetchIzinler = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get(getBackendUrl(API.LEAVES.MINE), {
        headers: { Authorization: user.token },
      });
      setIzinler(res.data);
      setError(null);
    } catch (e) {
      setError('İzinler alınamadı.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchRemainingDays = async () => {
    try {
      const res = await axios.get(getBackendUrl(API.LEAVES.REMAINING), {
        headers: { Authorization: user.token },
      });
      console.log('Remaining days response:', res.data);
      setRemainingDays(res.data);
    } catch (e) {
      console.log('Kalan izin günleri alınamadı:', e);
      // Varsayılan değer olarak 20 gün göster
      setRemainingDays({
        annual_limit: 20,
        used_days: 0,
        remaining_days: 20
      });
    }
  };

  useEffect(() => {
    fetchIzinler();
    fetchRemainingDays();
  }, [user.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIzinler(false);
    fetchRemainingDays();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#888" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  if (!izinler.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Henüz izin talebiniz yok.</Text>
      </View>
    );
  }

  const renderIzinItem = ({ item, index }) => {
    const formatDate = d => {
      const [y, m, g] = d.split('-');
      return `${g}/${m}/${y}`;
    };

    const getStatusInfo = (status) => {
      switch (status?.toLowerCase()) {
        case 'beklemede':
          return {
            icon: 'pending',
            color: '#ff9800',
            bgColor: '#fff3e0',
            text: 'Beklemede'
          };
        case 'onaylı':
          return {
            icon: 'check-circle',
            color: '#4caf50',
            bgColor: '#e8f5e8',
            text: 'Onaylandı'
          };
        case 'reddedildi':
          return {
            icon: 'cancel',
            color: '#f44336',
            bgColor: '#ffebee',
            text: 'Reddedildi'
          };
        case 'cancelled':
          return {
            icon: 'block',
            color: '#9e9e9e',
            bgColor: '#f5f5f5',
            text: 'İptal Edildi'
          };
        case 'completed':
          return {
            icon: 'done-all',
            color: '#2196f3',
            bgColor: '#e3f2fd',
            text: 'Tamamlandı'
          };
        case 'in_progress':
          return {
            icon: 'hourglass-empty',
            color: '#ff9800',
            bgColor: '#fff3e0',
            text: 'İşlemde'
          };
        default:
          return {
            icon: 'help',
            color: '#9e9e9e',
            bgColor: '#f5f5f5',
            text: status || 'Bilinmiyor'
          };
      }
    };

    const statusInfo = getStatusInfo(item.status);

    return (
      <View>
        <View style={styles.izinItem}>
          <View style={styles.izinContent}>
            <Text style={styles.dateText}>
              {item.start_date === item.end_date 
                ? formatDate(item.start_date)
                : `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`
              }
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <MaterialIcons 
                name={statusInfo.icon} 
                size={16} 
                color={statusInfo.color} 
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.separator} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Üst arka plan - profil ekranındaki gibi */}
        <View style={styles.topBg}>
          <View style={styles.headerSection}>
            <Text style={styles.headerSubtitle}>
              {remainingDays ? remainingDays.remaining_days : 20} kalan izin günü
            </Text>
            <Text style={styles.headerSubtitle}>{izinler.length} izin talebi</Text>
          </View>
        </View>
        
        {/* Profil ekranındaki gibi beyaz panel tasarımı */}
        <View style={styles.whiteSection}>
          <View style={styles.izinlerSection}>
            <FlatList
              data={izinler}
              keyExtractor={item => item.id?.toString() + item.start_date}
              renderItem={renderIzinItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingTop: 8 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  errorText: {
    fontSize: 16,
    color: '#e53935',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  topBg: {
    backgroundColor: '#f5f7fa',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 16,
  },
  headerSection: {
    paddingTop: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 4,
  },
  whiteSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 0,
    paddingTop: 0,
    flex: 1,
    minHeight: 300,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  izinlerSection: {
    paddingHorizontal: 0,
  },
  izinItem: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  izinContent: {
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
    marginBottom: 6,
    textAlign: 'left',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: 6,
  },
  separator: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 16,
  },
});
