import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';
import { MaterialIcons } from '@expo/vector-icons';

export default function InfoPanel({ startDate, endDate, visibleMonth, monthCache, limit, getDateRange }) {
  const { user } = useAuth();
  const [leaveInfo, setLeaveInfo] = useState(null);
  const [loadingLeaveInfo, setLoadingLeaveInfo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Seçili gün için izin bilgilerini getir
  const fetchLeaveInfo = useCallback(async (date) => {
    if (!date) return;
    
    setLoadingLeaveInfo(true);
    try {
      const res = await axios.get(getBackendUrl(`${API.LEAVES.DAY}?date=${date}`), {
        headers: { Authorization: user.token },
      });
      setLeaveInfo(res.data);
    } catch (e) {
      setLeaveInfo([]);
    }
    setLoadingLeaveInfo(false);
  }, [user.token]);

  // Tarih değişince izin bilgilerini güncelle
  useEffect(() => {
    if (startDate && !endDate) {
      // Tek gün seçiliyse o günün izin bilgilerini getir
      fetchLeaveInfo(startDate);
    } else {
      // Tarih aralığı seçiliyse veya hiç seçim yoksa izin bilgilerini temizle
      setLeaveInfo(null);
    }
  }, [startDate, endDate, fetchLeaveInfo]);

  // Açılır-kapanır animasyon
  const toggleExpanded = useCallback(() => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animation]);

  // Günleri ve doluluk durumunu hesapla
  const days = useMemo(() => {
    if (!startDate) return [];
    let result = [startDate];
    if (endDate) result = getDateRange(startDate, endDate);
    return result;
  }, [startDate, endDate, getDateRange]);

  const monthStr = visibleMonth;
  const monthDays = monthCache[monthStr] || {};
  
  const doluGunler = useMemo(() => {
    return days.filter(d => (monthDays[d] || 0) >= limit);
  }, [days, monthDays, limit]);
  
  const formatDate = useCallback(d => {
    const [y, m, g] = d.split('-');
    return `${g}/${m}/${y}`;
  }, []);

  // Eğer startDate yoksa erken return
  if (!startDate) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Seçili Tarih</Text>
        <Text style={styles.subtitle}>Henüz tarih seçilmedi</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {days.length === 1 ? `Seçili Tarih` : `Seçili Tarihler`}
      </Text>
      <Text style={styles.dateText}>
        {days.length === 1 ? formatDate(days[0]) : `${formatDate(days[0])} - ${formatDate(days[days.length - 1])}`}
      </Text>
      
      <View style={styles.statusContainer}>
        {doluGunler.length > 0 ? (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotError]} />
            <Text style={styles.statusTextError}>
              {`${doluGunler.length} gün uygun değil`}
            </Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotSuccess]} />
            <Text style={styles.statusTextSuccess}>
              Müsait
            </Text>
          </View>
        )}
      </View>

      {/* İzin Bilgileri - Sadece tek gün seçiliyken göster */}
      {startDate && !endDate && (
        <View style={styles.leaveInfoContainer}>
          <TouchableOpacity 
            style={styles.expandableHeader} 
            onPress={toggleExpanded}
            activeOpacity={0.7}
          >
            <Text style={styles.leaveInfoTitle}>İzinli Olanlar</Text>
            <MaterialIcons 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
          
          <Animated.View 
            style={[
              styles.expandableContent,
              {
                maxHeight: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500], // Maksimum yükseklik
                }),
                opacity: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              }
            ]}
          >
            {loadingLeaveInfo ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1976d2" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : leaveInfo && leaveInfo.length > 0 ? (
              <View style={styles.leaveList}>
                {leaveInfo.map((leave, index) => (
                  <View key={index} style={styles.leaveItem}>
                    <View style={[styles.statusDot, leave.status === 'onaylı' ? styles.statusDotSuccess : styles.statusDotWarning]} />
                    <Text style={styles.leaveText}>
                      {leave.id === user.id ? 'Ben' : `${leave.first_name || ''} ${leave.last_name || ''}`} ({leave.status === 'onaylı' ? 'Onaylı' : 'Beklemede'})
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noLeaveText}>O gün izinli olan yok</Text>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    fontWeight: '400',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotSuccess: {
    backgroundColor: '#4caf50',
  },
  statusDotError: {
    backgroundColor: '#e53935',
  },
  statusTextSuccess: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
  statusTextError: {
    fontSize: 16,
    color: '#e53935',
    fontWeight: '600',
  },
  // İzin bilgileri için stiller
  leaveInfoContainer: {
    marginTop: 20,
    width: '80%',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    marginLeft: -100,
  },
  leaveInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    textAlign: 'left',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
    textAlign: 'center',
  },
  leaveList: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  leaveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
    width: '100%',
    maxWidth: '100%',
    paddingVertical: 4,
  },
  leaveText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    textAlign: 'left',
    flex: 1,
    lineHeight: 20,
  },
  noLeaveText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  statusDotWarning: {
    backgroundColor: '#ff9800',
  },
  // Açılır-kapanır menü için stiller
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 10,
    marginRight: 20,
  },
  expandableContent: {
    overflow: 'hidden',
    width: '100%',
    paddingTop: 0,
  },
});
