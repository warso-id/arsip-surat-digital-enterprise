# 🤝 Panduan Kontribusi

Terima kasih atas minat Anda untuk berkontribusi pada Arsip Surat Digital Enterprise!

## Cara Berkontribusi

### 1. Persiapan
1. Fork repository
2. Clone fork Anda
3. Install dependencies: `npm install`
4. Buat branch baru: `git checkout -b feature/nama-fitur`

### 2. Development
1. Ikuti coding standards
2. Tulis unit tests
3. Update dokumentasi
4. Test perubahan Anda

### 3. Submit
1. Commit perubahan: `git commit -m "feat: deskripsi fitur"`
2. Push ke fork: `git push origin feature/nama-fitur`
3. Buat Pull Request

## Coding Standards

### JavaScript
```javascript
// Gunakan camelCase untuk variabel
const userName = 'John';

// Gunakan PascalCase untuk class
class UserController {}

// Gunakan UPPER_CASE untuk konstanta
const MAX_RETRY = 3;

// Gunakan single quotes
const message = 'Hello World';

// Gunakan arrow functions
const add = (a, b) => a + b;
