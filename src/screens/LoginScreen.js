import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';
import logo from '../assets/logo.png';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre alanları boş bırakılamaz');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(getBackendUrl(API.LOGIN), { email, password });
      console.log('Giriş başarılı:', res.data.email);
      login({
        email: res.data.email,
        role: res.data.role,
        token: res.data.token,
      });
    } catch (err) {
      let errorMessage = 'Giriş başarısız';
      
      if (err.response) {
        // Sunucudan hata yanıtı geldi (401, 400 gibi)
        if (err.response.status === 401) {
          errorMessage = 'Geçersiz e-posta veya şifre';
          // 401 hatası için sadece bilgilendirici log
          console.log('Giriş başarısız:', email);
        } else {
          errorMessage = err.response.data.error || 'Sunucu hatası';
          console.log('Sunucu hatası:', err.response.data);
        }
      } else if (err.request) {
        // İstek yapıldı ama yanıt alınamadı
        errorMessage = 'Sunucuya bağlanılamadı. Backend çalışıyor mu?';
        console.log('Bağlantı hatası - backend erişilemez');
      } else {
        // Diğer hatalar
        errorMessage = err.message || 'Bilinmeyen hata';
        console.log('Bilinmeyen hata:', err.message);
      }
      
      Alert.alert('Giriş Hatası', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Üst arka plan - diğer ekranlardaki gibi */}
      <View style={styles.topBg}>
        <View style={styles.logoSection}>
          <Image source={logo} style={styles.logo} />
        </View>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>İşletme ve İştirakler Müdürlüğü</Text>
          <Text style={styles.headerSubtitle}>Personel İzin Sistemi</Text>
        </View>
      </View>
      
      {/* Beyaz panel - diğer ekranlardaki gibi */}
      <View style={styles.whiteSection}>
        <View style={styles.formSection}>
          {/* E-posta alanı */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Kurumsal E-posta"
              placeholderTextColor="#888"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Şifre alanı */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
            />
            <TouchableOpacity 
              style={styles.passwordToggle} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          {/* Giriş butonu */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  topBg: {
    backgroundColor: '#f5f7fa',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 125,
    paddingBottom: 0,
  },
  headerSection: {
    paddingTop: 0,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 24,
    color: '#111',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  whiteSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 0,
    paddingTop: 32,
    flex: 1,
    minHeight: 300,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    justifyContent: 'flex-start',
  },
  formSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#222',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
