# NexPhys CLI

NexPhys platformu için komut satırı araçları. Bu araçlar, tenant oluşturma, şema yönetimi, veri tabanı migrasyonları ve test işlemleri için kullanılır.

## Kurulum

```bash
# Projenin kök dizininde
npm install

# CLI'ı global olarak erişilebilir yapmak için
cd src/scripts
npm run build
npm link
```

## Kullanım

```bash
# Yardım
nexphys --help

# Tenant oluşturma
nexphys tenant:create -d fitmax-gym -n "FitMax Gym" -t GYM -e admin@fitmax-gym.com

# Şema oluşturma
nexphys schema:create -d fitmax-gym

# Geliştirme ortamı kurulumu
nexphys setup:dev --clean --seed
```

## Veritabanı Mimarisi

NexPhys platformu aşağıdaki şema yapısını kullanır:

### Sistem Şemaları

- `sys`: Tenant yönetimi, abonelikler, sistem kullanıcıları
- `common`: Tüm tenantlar tarafından paylaşılan veriler

### Tenant Şeması

Her tenant için tek bir şema oluşturulur:

- `tenant_[domain]`: Tenant'a özgü tüm veriler (kullanıcılar, üyeler, işlemler vb.)

## Komutlar

### Tenant Yönetimi

- `tenant:create`: Yeni tenant oluşturma
- `tenant:remove`: Tenant silme
- `tenant:update`: Tenant güncelleme

### Şema Yönetimi

- `schema:create`: Tenant için şema oluşturma
- `schema:sync`: Şemaları veritabanı ile senkronize etme
- `schema:migrate`: Şemalar için migrasyon çalıştırma

### Seed Verileri

- `seed:roles`: Rol ve izinleri oluşturma
- `seed:users`: Test kullanıcıları oluşturma
- `seed:tenants`: Demo tenantlar oluşturma

### Test Komutları

- `test:api`: API testlerini çalıştırma
- `test:users`: Kullanıcı modülü testlerini çalıştırma

### Kurulum Komutları

- `setup:dev`: Geliştirme ortamını kurma
- `setup:prod`: Üretim ortamını kurma

## Yapı

```
src/scripts/
├── cli.ts                   # Ana CLI giriş noktası
├── commands/                # Komut kategorileri
│   ├── tenant/              # Tenant ile ilgili komutlar
│   ├── schema/              # Şema ile ilgili komutlar
│   ├── seed/                # Seed data komutları
│   ├── test/                # Test komutları
│   └── setup/               # Kurulum komutları
└── utils/                   # Ortak yardımcı fonksiyonlar
    ├── db.ts                # Veritabanı yardımcıları
    ├── logger.ts            # Loglama fonksiyonları
    ├── schema.ts            # Şema yardımcıları
    └── prompts.ts           # Kullanıcı giriş promptları
```

## Örnek İş Akışları

### Yeni Tenant Oluşturma

```bash
# 1. Tenant kaydı oluştur
nexphys tenant:create -d my-gym -n "My Gym" -t GYM -e admin@my-gym.com

# 2. Temel verileri ekle
nexphys seed:roles -d my-gym
nexphys seed:users -d my-gym --admin
```

### Geliştirme Ortamını Sıfırdan Kurma

```bash
# Temiz kurulum, demo tenantlar dahil
nexphys setup:dev --clean --seed
```

## Katkıda Bulunma

1. Yeni bir özellik eklerken uygun komut kategorisini kullanın
2. Tekrar kullanılabilir kod için `utils` klasörünü kullanın
3. Test komutlarınızı ekleyin
4. Bu README'yi güncelleyin 