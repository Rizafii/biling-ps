interface PrintData {
    namaPelanggan: string;
    relay: string;
    mode: string;
    durasi: string;
    tarifPerJam: number;
    totalBiaya: number;
    promo?: {
        name: string;
        type: string;
        value: number;
    } | null;
    diskon: number;
    totalBayar: number;
    waktuMulai: string;
    waktuSelesai: string;
    tanggalCetak: string;
}

export class ThermalPrinter {
    private static ESC = '\x1B';
    private static GS = '\x1D';

    // ESC/POS Commands
    private static COMMANDS = {
        INIT: '\x1B\x40', // Initialize printer
        CENTER: '\x1B\x61\x01', // Center align
        LEFT: '\x1B\x61\x00', // Left align
        RIGHT: '\x1B\x61\x02', // Right align
        BOLD_ON: '\x1B\x45\x01', // Bold on
        BOLD_OFF: '\x1B\x45\x00', // Bold off
        SIZE_NORMAL: '\x1D\x21\x00', // Normal size
        SIZE_DOUBLE: '\x1D\x21\x11', // Double size
        SIZE_WIDE: '\x1D\x21\x10', // Wide
        SIZE_TALL: '\x1D\x21\x01', // Tall
        CUT_PAPER: '\x1D\x56\x41', // Cut paper
        LINE_FEED: '\x0A', // Line feed
        DOUBLE_LINE_FEED: '\x0A\x0A', // Double line feed
    };

    private static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }

    private static formatDateTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    private static padLine(left: string, right: string, totalWidth: number = 32): string {
        const padding = totalWidth - left.length - right.length;
        return left + ' '.repeat(Math.max(0, padding)) + right;
    }

    private static centerText(text: string, width: number = 32): string {
        const padding = Math.max(0, width - text.length);
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    }

    private static generateReceiptContent(data: PrintData): string {
        const { COMMANDS } = ThermalPrinter;
        let content = '';

        // Initialize printer
        content += COMMANDS.INIT;

        // Header
        content += COMMANDS.CENTER + COMMANDS.BOLD_ON + COMMANDS.SIZE_DOUBLE;
        content += 'BILLING PLAYSTATION\n';
        content += COMMANDS.SIZE_NORMAL + COMMANDS.BOLD_OFF;
        content += ThermalPrinter.centerText('STRUK PEMBAYARAN') + '\n';
        content += COMMANDS.LEFT;
        content += '================================\n';

        // Receipt info
        content += ThermalPrinter.padLine('No. Struk:', `#${Date.now().toString().slice(-6)}`) + '\n';
        content += ThermalPrinter.padLine('Tanggal:', data.tanggalCetak) + '\n';
        content += '--------------------------------\n';

        // Customer info
        content += COMMANDS.BOLD_ON + 'DETAIL PELANGGAN\n' + COMMANDS.BOLD_OFF;
        content += ThermalPrinter.padLine('Nama:', data.namaPelanggan) + '\n';
        content += ThermalPrinter.padLine('Relay:', data.relay) + '\n';
        content += ThermalPrinter.padLine('Mode:', data.mode.toUpperCase()) + '\n';
        content += '--------------------------------\n';

        // Session info
        content += COMMANDS.BOLD_ON + 'DETAIL SESI\n' + COMMANDS.BOLD_OFF;
        content += ThermalPrinter.padLine('Mulai:', ThermalPrinter.formatDateTime(data.waktuMulai)) + '\n';
        content += ThermalPrinter.padLine('Selesai:', ThermalPrinter.formatDateTime(data.waktuSelesai)) + '\n';
        content += ThermalPrinter.padLine('Durasi:', data.durasi) + '\n';
        content += ThermalPrinter.padLine('Tarif/Jam:', ThermalPrinter.formatCurrency(data.tarifPerJam)) + '\n';
        content += '--------------------------------\n';

        // Billing details
        content += COMMANDS.BOLD_ON + 'DETAIL TAGIHAN\n' + COMMANDS.BOLD_OFF;
        content += ThermalPrinter.padLine('Subtotal:', ThermalPrinter.formatCurrency(data.totalBiaya)) + '\n';

        // Promo details
        if (data.promo && data.diskon > 0) {
            content += ThermalPrinter.padLine('Promo:', data.promo.name) + '\n';
            let promoDetail = '';
            if (data.promo.type === 'flat') {
                promoDetail = `Diskon ${ThermalPrinter.formatCurrency(data.promo.value)}`;
            } else if (data.promo.type === 'percent') {
                promoDetail = `Diskon ${data.promo.value}%`;
            } else if (data.promo.type === 'time') {
                promoDetail = `Gratis ${data.promo.value} menit`;
            }
            content += ThermalPrinter.padLine('', promoDetail) + '\n';
            content += ThermalPrinter.padLine('Diskon:', `-${ThermalPrinter.formatCurrency(data.diskon)}`) + '\n';
        }

        content += '================================\n';
        content += COMMANDS.BOLD_ON + COMMANDS.SIZE_WIDE;
        content += ThermalPrinter.padLine('TOTAL BAYAR:', ThermalPrinter.formatCurrency(data.totalBayar)) + '\n';
        content += COMMANDS.SIZE_NORMAL + COMMANDS.BOLD_OFF;
        content += '================================\n';

        // Footer
        content += COMMANDS.CENTER;
        content += '\n';
        content += 'Terima kasih atas kunjungan Anda\n';
        content += '\n\n\n';

        // Cut paper
        content += COMMANDS.CUT_PAPER;

        return content;
    }

    public static async printReceipt(data: PrintData): Promise<boolean> {
        try {
            // Try modern Web Serial API first (Chrome 89+)
            if ('serial' in navigator && (navigator as any).serial) {
                try {
                    return await this.printViaWebSerial(data);
                } catch (serialError) {
                    console.warn('Web Serial failed, trying alternative methods:', serialError);
                }
            }

            // Fallback to window.print() with formatted content
            return await this.printViaWindowPrint(data);
        } catch (error) {
            console.error('Print error:', error);

            // Final fallback - show print dialog with formatted content
            this.showPrintPreview(data);
            return true;
        }
    }

    private static async printViaWebSerial(data: PrintData): Promise<boolean> {
        try {
            // Check if user has already granted permission
            const availablePorts = await (navigator as any).serial.getPorts();
            let port;

            if (availablePorts.length > 0) {
                // Use the first available port
                port = availablePorts[0];
            } else {
                // Request serial port access
                port = await (navigator as any).serial.requestPort({
                    filters: [
                        // Common thermal printer vendor IDs
                        { usbVendorId: 0x0416 }, // CUSTOM
                        { usbVendorId: 0x04b8 }, // Epson
                        { usbVendorId: 0x0519 }, // Star
                        { usbVendorId: 0x0fe6 }, // ICS Advent
                    ],
                });
            }

            await port.open({
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none',
            });

            const writer = port.writable.getWriter();
            const receiptContent = this.generateReceiptContent(data);
            const encoder = new TextEncoder();

            await writer.write(encoder.encode(receiptContent));
            await writer.close();
            await port.close();

            return true;
        } catch (error) {
            console.error('Web Serial API error:', error);
            throw error;
        }
    }

    private static async printViaWindowPrint(data: PrintData): Promise<boolean> {
        // Create a formatted HTML version for standard printing
        const printContent = this.generateHTMLReceipt(data);

        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (!printWindow) {
            throw new Error('Could not open print window');
        }

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };

        return true;
    }

    private static generateHTMLReceipt(data: PrintData): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Pembayaran</title>
                <style>
                    @media print {
                        @page {
                            size: 58mm auto;
                            margin: 2mm;
                        }
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        line-height: 1.2;
                        margin: 0;
                        padding: 5px;
                        width: 58mm;
                        background: white;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .large { font-size: 16px; }
                    .line { border-bottom: 1px dashed #000; margin: 2px 0; }
                    .row { display: flex; justify-content: space-between; }
                    .double-line { border-bottom: 2px solid #000; margin: 2px 0; }
                </style>
            </head>
            <body>
                <div class="center bold large">BILLING PLAYSTATION</div>
                <div class="center">STRUK PEMBAYARAN</div>
                <div class="line"></div>
                
                <div class="row">
                    <span>No. Struk:</span>
                    <span>#${Date.now().toString().slice(-6)}</span>
                </div>
                <div class="row">
                    <span>Tanggal:</span>
                    <span>${data.tanggalCetak}</span>
                </div>
                <div class="line"></div>
                
                <div class="bold">DETAIL PELANGGAN</div>
                <div class="row">
                    <span>Nama:</span>
                    <span>${data.namaPelanggan}</span>
                </div>
                <div class="row">
                    <span>Relay:</span>
                    <span>${data.relay}</span>
                </div>
                <div class="row">
                    <span>Mode:</span>
                    <span>${data.mode.toUpperCase()}</span>
                </div>
                <div class="line"></div>
                
                <div class="bold">DETAIL SESI</div>
                <div class="row">
                    <span>Mulai:</span>
                    <span>${this.formatDateTime(data.waktuMulai)}</span>
                </div>
                <div class="row">
                    <span>Selesai:</span>
                    <span>${this.formatDateTime(data.waktuSelesai)}</span>
                </div>
                <div class="row">
                    <span>Durasi:</span>
                    <span>${data.durasi}</span>
                </div>
                <div class="row">
                    <span>Tarif/Jam:</span>
                    <span>${this.formatCurrency(data.tarifPerJam)}</span>
                </div>
                <div class="line"></div>
                
                <div class="bold">DETAIL TAGIHAN</div>
                <div class="row">
                    <span>Subtotal:</span>
                    <span>${this.formatCurrency(data.totalBiaya)}</span>
                </div>
                
                ${
                    data.promo && data.diskon > 0
                        ? `
                    <div class="row">
                        <span>Promo:</span>
                        <span>${data.promo.name}</span>
                    </div>
                    <div class="row">
                        <span>Diskon:</span>
                        <span>-${this.formatCurrency(data.diskon)}</span>
                    </div>
                `
                        : ''
                }
                
                <div class="double-line"></div>
                <div class="row bold large">
                    <span>TOTAL BAYAR:</span>
                    <span>${this.formatCurrency(data.totalBayar)}</span>
                </div>
                <div class="double-line"></div>
                
                <div class="center">
                    <br>
                    Terima kasih atas kunjungan Anda<br>
                    Selamat bermain!<br>
                    <br>
                    <div class="line"></div>
                    Powered by Billing PS System
                </div>
            </body>
            </html>
        `;
    }

    private static showPrintPreview(data: PrintData): void {
        // Create a modal with the receipt content for manual printing
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        const receiptText = this.generateReceiptContent(data)
            .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters for display
            .replace(/\n/g, '<br>');

        content.innerHTML = `
            <h3>Preview Struk</h3>
            <div style="font-family: monospace; font-size: 12px; white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${receiptText}
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="window.print()" style="margin-right: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Print
                </button>
                <button onclick="this.closest('[style*=fixed]').remove()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    public static async isSupported(): Promise<boolean> {
        // Check Web Serial API support
        if ('serial' in navigator && (navigator as any).serial) {
            return true;
        }

        // Check standard print support
        if (typeof window !== 'undefined' && typeof window.print === 'function') {
            return true;
        }

        return false;
    }

    // Method to check if thermal printer is connected
    public static async checkPrinterConnection(): Promise<boolean> {
        try {
            if ('serial' in navigator && (navigator as any).serial) {
                const ports = await (navigator as any).serial.getPorts();
                return ports.length > 0;
            }
            return false;
        } catch (error) {
            console.error('Error checking printer connection:', error);
            return false;
        }
    }

    // Method to get available printer ports
    public static async getAvailablePorts(): Promise<any[]> {
        try {
            if ('serial' in navigator && (navigator as any).serial) {
                return await (navigator as any).serial.getPorts();
            }
            return [];
        } catch (error) {
            console.error('Error getting available ports:', error);
            return [];
        }
    }
}
