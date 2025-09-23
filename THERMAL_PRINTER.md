# Thermal Printer Integration

## Overview
Sistem billing PS telah dilengkapi dengan fitur print struk pembayaran ke printer thermal. Fitur ini mendukung berbagai metode printing untuk kompatibilitas maksimal.

## Supported Printer Methods

### 1. Web Serial API (Recommended)
- **Browser**: Chrome 89+, Edge 89+
- **Connection**: USB/Serial connection
- **Setup**: Otomatis detect printer thermal dengan vendor ID populer
- **Advantages**: Direct communication dengan printer, hasil terbaik

### 2. Standard Browser Print
- **Browser**: Semua modern browsers
- **Connection**: Network printer atau USB printer dengan driver
- **Setup**: Printer harus ter-install di sistem operasi
- **Advantages**: Universal compatibility

### 3. Print Preview Fallback
- **Browser**: Semua browsers
- **Connection**: Manual printing
- **Setup**: Tidak perlu setup khusus
- **Advantages**: Selalu bekerja sebagai fallback

## Printer Compatibility

### Tested Thermal Printers
- **CUSTOM** (Vendor ID: 0x0416)
- **Epson** (Vendor ID: 0x04b8)
- **Star** (Vendor ID: 0x0519)
- **ICS Advent** (Vendor ID: 0x0fe6)

### Receipt Format
- **Width**: 58mm (optimized for thermal receipts)
- **Font**: Monospace untuk alignment yang konsisten
- **Content**: 
  - Header dengan logo/nama bisnis
  - Detail pelanggan
  - Detail sesi gaming
  - Detail tagihan dengan promo (jika ada)
  - Total pembayaran
  - Footer dengan terima kasih

## Usage

### Automatic Print
Ketika melakukan pembayaran melalui Modal Pembayaran:
1. Klik tombol "💰 Bayar & Print"
2. Sistem akan otomatis mencetak struk setelah pembayaran berhasil
3. Jika printing gagal, tidak akan mempengaruhi proses pembayaran

### Manual Print
Untuk mencetak ulang atau preview:
1. Klik tombol "🖨️ Print Saja" di modal pembayaran
2. Sistem akan menampilkan notifikasi status printing
3. Jika Web Serial tidak tersedia, akan fallback ke browser print

## Browser Permissions

### Web Serial API Setup
1. **First Time**: Browser akan meminta permission untuk akses serial port
2. **Subsequent**: Permission tersimpan untuk domain
3. **Multiple Printers**: Bisa pilih printer yang berbeda

### Troubleshooting
- **Permission Denied**: Refresh page dan coba lagi
- **Printer Not Found**: Pastikan printer USB terhubung dan powered on
- **Print Quality**: Pastikan thermal paper masih bagus
- **Driver Issues**: Install driver printer jika menggunakan standard print

## Technical Details

### ESC/POS Commands
System menggunakan standard ESC/POS commands:
- `\x1B\x40`: Initialize printer
- `\x1B\x61\x01`: Center align
- `\x1B\x45\x01`: Bold on/off
- `\x1D\x21\x11`: Double size text
- `\x1D\x56\x41`: Cut paper

### Error Handling
- Silent failure untuk auto-print setelah pembayaran
- User notification untuk manual print attempts
- Graceful fallback ke metode alternatif

## Configuration

### Default Settings
```typescript
// Printer settings
baudRate: 9600
dataBits: 8
stopBits: 1
parity: 'none'
flowControl: 'none'

// Paper settings
width: 58mm (32 characters)
encoding: UTF-8
```

### Customization
Untuk mengubah format struk, edit file `resources/js/utils/thermalPrint.ts`:
- `generateReceiptContent()`: Format ESC/POS
- `generateHTMLReceipt()`: Format HTML untuk browser print
- Header/footer text
- Layout dan spacing

## Development Notes

### Testing Without Printer
1. Browser print akan menampilkan print dialog
2. Print preview modal akan muncul sebagai fallback
3. Console log menampilkan debug information

### Adding New Printer Support
Tambahkan vendor ID di `printViaWebSerial()`:
```typescript
filters: [
    { usbVendorId: 0x0416 }, // CUSTOM
    { usbVendorId: 0x1234 }, // New vendor
]
```

## Future Enhancements
- Network printer support (IP printing)
- Multiple receipt templates
- QR code integration
- Barcode printing
- Receipt email backup