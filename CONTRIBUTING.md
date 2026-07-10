# Panduan Kontribusi

## Cara Berkontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur/fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur/fitur-baru`)
5. Buat Pull Request

## Standar Kode

- Gunakan Vue 3 Composition API
- Ikuti ESLint configuration
- Tulis komentar untuk fungsi kompleks
- Gunakan Bahasa Indonesia untuk komentar
- Ikuti struktur folder yang ada

## Commit Messages

Format: `[tipe] deskripsi singkat`

Tipe:
- `feat`: Fitur baru
- `fix`: Perbaikan bug
- `docs`: Dokumentasi
- `style`: Format kode
- `refactor`: Refactoring
- `test`: Testing
- `chore`: Maintenance

Contoh:
- `feat: menambahkan fitur export PDF`
- `fix: memperbaiki bug pada login`
- `docs: update dokumentasi API`

## Testing

- Tulis unit test untuk komponen baru
- Pastikan semua test pass sebelum PR
- Jalankan `npm run test` sebelum commit

## Pull Request

- Deskripsikan perubahan dengan jelas
- Sertakan screenshot untuk perubahan UI
- Referensikan issue terkait
- Pastikan branch up-to-date dengan main
