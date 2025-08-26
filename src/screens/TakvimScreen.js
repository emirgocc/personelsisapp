import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Modal, Pressable, RefreshControl, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import InfoPanel from '../components/InfoPanel';
import ActionButtons from '../components/ActionButtons';
import CalendarPanel from '../components/CalendarPanel';
import { getBackendUrl, API } from '../config/config';
// DateTimePicker importunu kaldırıyoruz

const { height } = Dimensions.get('window');

export default function TakvimScreen() {
  const { user } = useAuth();
  const [markedDates, setMarkedDates] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [limit, setLimit] = useState(2); // Takım limiti
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCache, setMonthCache] = useState({}); // { '2024-06': { '2024-06-01': 2, ... } }
  const [visibleMonth, setVisibleMonth] = useState(currentDate.toISOString().slice(0, 7));
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDays, setPendingDays] = useState([]);
  const [pendingRange, setPendingRange] = useState({ start: null, end: null });

  // Yardımcı: iki tarih arası tüm günleri dizi olarak döndür
  function getDateRange(start, end) {
    const arr = [];
    let dt = new Date(start);
    const endDt = new Date(end);
    while (dt <= endDt) {
      arr.push(dt.toISOString().slice(0, 10));
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }

  // Ay değişince backend'den toplu izinli günleri çek
  const fetchMonth = async (monthStr, force = false) => {
    if (!force && monthCache[monthStr]) return; // cache varsa tekrar çekme
    setLoading(true);
    try {
      const res = await axios.get(getBackendUrl(`${API.LEAVES.MONTH}?month=${monthStr}`), {
        headers: { Authorization: user.token },
      });
      setMonthCache(prev => {
        const updated = { ...prev, [monthStr]: res.data };
        return updated;
      });
      setTimeout(updateMarks, 0); // veri geldikten sonra işaretlemeleri güncelle
    } catch (e) {}
    setLoading(false);
  };

  // Takvimdeki işaretlemeleri güncelle
  const updateMarks = () => {
    const monthStr = visibleMonth;
    const days = monthCache[monthStr] || {};
    let marks = {};
    const today = new Date();
    // Seçili günler
    let selectedDays = [];
    if (startDate && endDate) selectedDays = getDateRange(startDate, endDate);
    else if (startDate) selectedDays = [startDate];
    // O ayın tüm günleri için işaretleme
    Object.keys(days).forEach(dateStr => {
      const d = new Date(dateStr);
      const isPast = d < new Date(new Date().toDateString());
      const isSelected = selectedDays.includes(dateStr);
      // Renkler
      let bg = undefined;
      let border = 'transparent';
      let textColor = '#222';
      let fontWeight = 'normal';
      if (days[dateStr] >= limit) bg = 'rgba(229,57,53,0.2)'; // şeffaf kırmızı
      else if (days[dateStr] === limit - 1) bg = 'rgba(251,192,45,0.2)'; // şeffaf sarı
      if (isSelected) {
        border = '#888';
        textColor = '#111';
        fontWeight = 'bold';
        if (days[dateStr] >= limit) bg = 'rgba(229,57,53,0.2)';
        else if (days[dateStr] === limit - 1) bg = 'rgba(251,192,45,0.2)';
      }
      marks[dateStr] = {
        disabled: isPast,
        disableTouchEvent: isPast,
        customStyles: {
          container: {
            backgroundColor: bg,
            borderRadius: 6,
            borderWidth: isSelected ? 2 : 0,
            borderColor: border,
          },
          text: isPast
            ? { color: '#bdbdbd', fontWeight: 'normal', textAlignVertical: 'center' }
            : { color: textColor, fontWeight: fontWeight, textAlignVertical: 'center' },
        },
      };
    });
    // Seçili günlerden backend'den gelmeyenleri de işaretle
    selectedDays.forEach(dateStr => {
      if (!marks[dateStr]) {
        const d = new Date(dateStr);
        const isPast = d < new Date(new Date().toDateString());
        marks[dateStr] = {
          disabled: isPast,
          disableTouchEvent: isPast,
          customStyles: {
            container: {
              borderRadius: 6,
              borderWidth: 2,
              borderColor: '#888',
            },
            text: isPast
              ? { color: '#bdbdbd', fontWeight: 'normal', textAlignVertical: 'center' }
              : { color: '#111', fontWeight: 'bold', textAlignVertical: 'center' },
          },
        };
      }
    });
    setMarkedDates(marks);
  };

  // Info metni: seçili tarih(ler) ve uygun olmayan günler
  const getInfoText = () => {
    if (!startDate) return '';
    let days = [startDate];
    if (endDate) days = getDateRange(startDate, endDate);
    const monthStr = visibleMonth;
    const monthDays = monthCache[monthStr] || {};
    const doluGunler = days.filter(d => (monthDays[d] || 0) >= limit);
    let info = '';
    if (days.length === 1) {
      info = `Seçili Tarih: ${days[0]}`;
    } else {
      info = `Seçili Tarihler: ${days[0]} - ${days[days.length - 1]}`;
    }
    if (doluGunler.length > 0) {
      info += `\nUygun olmayan günler: ${doluGunler.join(', ')}`;
    } else {
      info += `\nMüsait`;
    }
    return info;
  };

  // Takvimde ay değişince tetiklenir
  const handleMonthChange = (monthObj) => {
    const monthStr = `${monthObj.year}-${String(monthObj.month).padStart(2, '0')}`;
    setVisibleMonth(monthStr);
    fetchMonth(monthStr);
  };

  const onRefresh = async () => {
    setLoading(true);
    setMonthCache(prev => ({ ...prev, [visibleMonth]: undefined })); // sadece aktif ayı temizle
    await fetchMonth(visibleMonth, true); // force fetch
    setLoading(false);
    // updateMarks artık fetchMonth içinde veri geldikten sonra çağrılıyor
  };

  useEffect(() => {
    fetchMonth(visibleMonth);
    // eslint-disable-next-line
  }, [visibleMonth, user.token]);

  useEffect(() => {
    updateMarks();
    // eslint-disable-next-line
  }, [monthCache, startDate, endDate, visibleMonth]);

  // Gün seçimi/aralık seçimi
  const handleDayPress = (day) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (day.dateString < startDate) {
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  // + butonuna tıklanınca
  const handlePlus = () => {
    if (!startDate) {
      Alert.alert('Uyarı', 'Lütfen önce bir gün veya aralık seçin.');
      return;
    }
    let days = [startDate];
    if (endDate) days = getDateRange(startDate, endDate);
    setPendingDays(days);
    setPendingRange({ start: startDate, end: endDate });
    setConfirmVisible(true);
  };

  const sendLeaveRequest = async () => {
    setLoading(true);
    setConfirmVisible(false);
    try {
      await axios.post(getBackendUrl(API.LEAVES.CREATE), {
        start_date: pendingRange.start,
        end_date: pendingRange.end || pendingRange.start,
      }, {
        headers: { Authorization: user.token },
      });
      Alert.alert('Başarılı', 'İzin talebiniz gönderildi.');
      setStartDate(null);
      setEndDate(null);
    } catch (e) {
      Alert.alert('Hata', 'İzin talebi gönderilemedi.');
    }
    setLoading(false);
  };

  // Çarpı butonuna tıklanınca
  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Üst arka plan - profil ekranındaki gibi */}
          <View style={styles.topBg}>
            <CalendarPanel
              currentDate={currentDate}
              markedDates={markedDates}
              handleDayPress={handleDayPress}
              handleMonthChange={handleMonthChange}
            />
          </View>
          
          {/* Profil ekranındaki gibi beyaz panel tasarımı */}
          <View style={styles.whiteSection}>
            <View style={styles.infoSection}>
              <InfoPanel
                startDate={startDate}
                endDate={endDate}
                visibleMonth={visibleMonth}
                monthCache={monthCache}
                limit={limit}
                getDateRange={getDateRange}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      {startDate && (
        <ActionButtons
          onClear={handleClear}
          onPlus={handlePlus}
        />
      )}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 280, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>İzin Talebi</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>
              {pendingRange.start && pendingRange.end && pendingRange.start !== pendingRange.end
                ? `Seçili Tarihler: ${pendingRange.start} - ${pendingRange.end}`
                : `Seçili Tarih: ${pendingRange.start}`}
            </Text>
            <Text style={{ fontSize: 15, color: '#666', marginBottom: 18 }}>İzin talebi göndermek istediğinize emin misiniz?</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable onPress={() => setConfirmVisible(false)} style={{ backgroundColor: '#e0e0e0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 22, marginRight: 8 }}>
                <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>Vazgeç</Text>
              </Pressable>
              <Pressable onPress={sendLeaveRequest} style={{ backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 22 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Evet</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBg: {
    backgroundColor: '#f5f7fa',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 16,
  },
  whiteSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 0,
    paddingTop: 32,
    flex: 1,
    minHeight: 250,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoSection: {
    marginTop: -40,
    marginBottom: 24,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
});