# Personel İzin Sistemi - Mobile App

Belediye İşletme ve İştirakler Müdürlüğü personellerinin izin taleplerini ve ekip yönetimini kolaylaştıran React Native mobil uygulaması.

## 📋 Proje Hakkında

Bu uygulama, belediyenin İşletme ve İştirakler Müdürlüğünün sorumlu olduğu yerlerdeki personeller için geliştirilmiştir. Ana amacı, ekip içindeki izin çakışmalarını önlemek ve amirlerin izin onay süreçlerini kolaylaştırmaktır.

### 🎯 Temel İhtiyaç
Bir ekipten fazla kişinin aynı gün izinli olması durumunda ortaya çıkan operasyonel sıkıntıların önlenmesi.

### ✨ Ana Özellikler

#### 👤 Personel Özellikleri
- **Takvim Görünümü**: Ay bazında izin durumlarını görüntüleme
- **İzin Talebi**: Tek gün veya tarih aralığı seçerek izin talebi oluşturma
- **Gerçek Zamanlı Kontrol**: Seçilen tarihlerde ekip doluluk durumunu görme
- **İzin Geçmişi**: Kendi izin taleplerini ve durumlarını takip etme
- **Kalan İzin Günü**: Kullanılabilir izin günü sayısını görme

#### 👨‍💼 Amir Özellikleri
- **Onay Yönetimi**: Bekleyen izin taleplerini onaylama/reddetme
- **Ekip Yönetimi**: Personelleri farklı ekipler arasında transfer etme
- **İzin Limiti Ayarları**: Ekip bazında günlük izin limitlerini belirleme
- **Anlık Bildirimler**: Bekleyen onay sayısını tab bar'da görme

## 🛠 Teknoloji Stack

### Frontend (Bu Repo)
- **React Native**: 0.79.5
- **Expo**: 53.0.22
- **React Navigation**: 6.x (Stack & Bottom Tabs)
- **React Native Calendars**: Takvim bileşeni
- **Axios**: HTTP istekleri
- **Expo Vector Icons**: Material Icons

### Context API
- **AuthContext**: Kullanıcı kimlik doğrulama yönetimi
- **PendingCountContext**: Bekleyen onay sayısı takibi

### Bileşen Yapısı
```
src/
├── components/
│   ├── ActionButtons.js     # Floating action buttons
│   ├── CalendarPanel.js     # Takvim bileşeni
│   └── InfoPanel.js         # İzin bilgileri paneli
├── context/
│   ├── AuthContext.js       # Kimlik doğrulama
│   └── PendingCountContext.js # Onay sayısı
├── screens/
│   ├── LoginScreen.js       # Giriş ekranı
│   ├── TakvimScreen.js      # Ana takvim ekranı
│   ├── IzinlerimScreen.js   # İzin geçmişi
│   ├── BekleyenOnaylarScreen.js # Amir onay ekranı
│   ├── EkipAyarScreen.js    # Ekip yönetimi
│   └── ProfilScreen.js      # Profil ve çıkış
└── config/
    └── config.js            # API endpoint'leri
```

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler
- Node.js (16.x veya üzeri)
- npm veya yarn
- Expo CLI
- Android Studio (Android için) veya Xcode (iOS için)

### Kurulum Adımları

1. **Repo'yu klonlayın**
   ```bash
   git clone [repo-url]
   cd personelsisapp
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Backend URL'ini ayarlayın**
   ```javascript
   // src/config/config.js dosyasında
   BACKEND: {
     BASE_URL: 'http://YOUR_BACKEND_IP:8000',
   }
   ```

4. **Uygulamayı başlatın**
   ```bash
   # Geliştirme sunucusu
   npm start
   
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

### 📱 Build Komutları

```bash
# Android preview build
npm run build:android

# Android production build
npm run build:android:prod

# Hızlı build (dev-client)
npm run build:fast
```

## 🏗 Uygulama Mimarisi

### Ekran Yapısı
- **Login Ekranı**: E-posta/şifre ile giriş
- **Tab Navigation**: Rol bazında farklı sekmeler
  - **Personel**: Takvim, İzinlerim, Profil
  - **Amir**: Bekleyen Onaylar, Ekipler, Profil

### Rol Sistemi
- **Personel (role: 'user')**: Kendi izinlerini yönetir
- **Amir (role: 'admin')**: Tüm ekip izinlerini yönetir

### API Entegrasyonu
```javascript
API Endpoints:
├── Authentication
│   ├── POST /login
│   └── GET /me
├── Leaves (İzinler)
│   ├── POST /leaves/create
│   ├── GET /leaves/mine
│   ├── GET /leaves/remaining
│   ├── GET /leaves/day?date=
│   ├── GET /leaves/month?month=
│   ├── GET /leaves/pending
│   └── POST /leaves/approve
└── Teams (Ekipler)
    ├── GET /teams/info
    ├── GET /teams/members
    ├── GET /teams/all
    └── POST /teams/update-team-leave-limit
```

## 🎨 UI/UX Özellikleri

### Tasarım Sistemi
- **Renk Paleti**: Material Design (Primary: #1976d2)
- **Tipografi**: System fonts, kurumsal hiyerarşi
- **Layout**: Card-based design, consistent spacing
- **Animasyonlar**: Smooth transitions, expand/collapse

### Responsive Design
- Portrait orientation optimize
- Tablet desteği (iPad)

### Accessibility
- Material Icons kullanımı
- Uygun kontrast oranları
- Touch target guidelines

## 🔧 Konfigürasyon

### Expo Configuration (app.json)
```json
{
  "expo": {
    "name": "Personel Sis App",
    "slug": "personelsisapp",
    "orientation": "portrait",
    "android": {
      "package": "com.emirgoc.personelsisapp",
      "usesCleartextTraffic": true
    }
  }
}
```

### Network Security (Android)
HTTP trafiğine izin vermek için `android/app/src/main/res/xml/network_security_config.xml` yapılandırılmıştır.

## 📊 Önemli Özellikler Detayı

### 1. Akıllı Takvim Sistemi
- Gerçek zamanlı doluluk durumu
- Renk kodlu görselleştirme (Kırmızı: Dolu, Sarı: Neredeyse dolu)
- Geçmiş tarih kısıtlaması
- Ay bazında cache sistemi

### 2. İzin Çakışma Kontrolü
- Ekip bazında günlük limit belirleme
- Anlık durum kontrolü
- Uyarı sistemleri

### 3. Rol Bazında Yetkilendirme
- Context API ile merkezi auth yönetimi
- Otomatik token yenileme
- Güvenli logout işlemi

### 4. Performans Optimizasyonları
- Lazy loading
- Component memoization
- Efficient re-rendering
- Image optimization

## 🐛 Bilinen Sorunlar ve Çözümler

### Android Network Issues
- Clear text traffic problemi için network security config eklendi
- IP adresi değişikliklerinde config.js güncellenmeli


## 🔐 Güvenlik

### Authentication
- JWT token based auth
- Secure storage (gelecek versiyonda)
- Session timeout yönetimi

### Data Security
- HTTPS öneriliği (production için)
- Input validation
- SQL injection koruması (backend)

## 📈 Gelecek Geliştirmeler

### v2.0 Roadmap
- [ ] Push notifications

### Performance Improvements
- [ ] Redux/Zustand state management
- [ ] React Query for cache management
- [ ] Code splitting
- [ ] Bundle size optimization

## 📝 Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.

## 👥 Takım

- **Full Stack**: [Emir Göç]

## 📞 İletişim

Herhangi bir sorun veya öneriniz için:
- **E-posta**: [emirgoc.39@gmail.com]
---

**Bu uygulama İşletme ve İştirakler Müdürlüğü personellerinin ihtiyaçları doğrultusunda geliştirilmiştir. 🏢**
