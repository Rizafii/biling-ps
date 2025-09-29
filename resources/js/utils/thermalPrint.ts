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
    // user: string;
}

export class ThermalPrinter {
    private static ESC = '\x1B';
    private static GS = '\x1D';
    private static FS = '\x1C';

    // ESC/POS Commands - Standard thermal printer commands
    private static COMMANDS = {
        // Basic commands
        INIT: '\x1B\x40',           // ESC @ - Initialize printer
        RESET: '\x1B\x40',          // ESC @ - Reset printer

        // Text alignment
        ALIGN_LEFT: '\x1B\x61\x00',      // ESC a 0
        ALIGN_CENTER: '\x1B\x61\x01',    // ESC a 1
        ALIGN_RIGHT: '\x1B\x61\x02',     // ESC a 2

        // Text formatting
        BOLD_ON: '\x1B\x45\x01',         // ESC E 1
        BOLD_OFF: '\x1B\x45\x00',        // ESC E 0
        UNDERLINE_ON: '\x1B\x2D\x01',    // ESC - 1
        UNDERLINE_OFF: '\x1B\x2D\x00',   // ESC - 0

        // Text size - GS !
        SIZE_NORMAL: '\x1D\x21\x00',     // GS ! 0 (normal)
        SIZE_DOUBLE_HEIGHT: '\x1D\x21\x01', // GS ! 1 (double height)
        SIZE_DOUBLE_WIDTH: '\x1D\x21\x10',  // GS ! 16 (double width)
        SIZE_DOUBLE_BOTH: '\x1D\x21\x11',   // GS ! 17 (double height & width)
        SIZE_TRIPLE: '\x1D\x21\x22',     // GS ! 34 (triple size)

        // Character set
        CHARSET_PC437: '\x1B\x74\x00',   // ESC t 0 (PC437 USA)
        CHARSET_KATAKANA: '\x1B\x74\x01', // ESC t 1 (Katakana)
        CHARSET_PC850: '\x1B\x74\x02',   // ESC t 2 (PC850 Multilingual)

        // Line spacing
        LINE_SPACING_DEFAULT: '\x1B\x32', // ESC 2 (default line spacing)
        LINE_SPACING_TIGHT: '\x1B\x33\x10', // ESC 3 16 (tight spacing)

        // Paper control
        PAPER_CUT_FULL: '\x1D\x56\x00',     // GS V 0 (full cut)
        PAPER_CUT_PARTIAL: '\x1D\x56\x01',  // GS V 1 (partial cut)
        PAPER_FEED_LINE: '\x0A',            // LF
        PAPER_FEED_LINES: '\x1B\x64',       // ESC d (feed n lines)

        // Special characters
        BEEP: '\x07',                    // BEL (beep)
        TAB: '\x09',                     // HT (horizontal tab)
        CARRIAGE_RETURN: '\x0D',         // CR

        // Barcode commands (if needed)
        BARCODE_HEIGHT: '\x1D\x68',     // GS h
        BARCODE_WIDTH: '\x1D\x77',      // GS w
        BARCODE_PRINT: '\x1D\x6B',      // GS k
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

    private static formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    private static formatTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }


    // Create properly spaced line with exact character positioning
    private static createLine(left: string, right: string, totalWidth: number = 32): string {
        // Ensure strings don't exceed available space
        const maxLeftWidth = totalWidth - right.length - 1; // -1 for at least one space
        const truncatedLeft = left.length > maxLeftWidth ? left.substring(0, maxLeftWidth) : left;

        const spacesNeeded = totalWidth - truncatedLeft.length - right.length;
        const spaces = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : ' ';

        return truncatedLeft + spaces + right;
    }

    // Create centered text
    private static centerText(text: string, width: number = 32): string {
        if (text.length >= width) return text.substring(0, width);

        const totalPadding = width - text.length;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;

        return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
    }

    // Create separator line
    private static createSeparator(char: string = '-', width: number = 32): string {
        return char.repeat(width);
    }

    private static generateReceiptContent(data: PrintData): string {
        const { COMMANDS } = ThermalPrinter;
        let content = '';

        // Initialize printer
        content += COMMANDS.INIT;
        content += COMMANDS.CHARSET_PC437;
        content += COMMANDS.LINE_SPACING_DEFAULT;

        // Header
        content += COMMANDS.ALIGN_CENTER;
        content += COMMANDS.SIZE_DOUBLE_BOTH;
        content += COMMANDS.BOLD_ON;
        content += 'AF RIMURU' + COMMANDS.PAPER_FEED_LINE;
        content += COMMANDS.SIZE_NORMAL;
        content += COMMANDS.BOLD_OFF;

        content += COMMANDS.SIZE_DOUBLE_WIDTH;
        content += 'PLAYPAL CAFE' + COMMANDS.PAPER_FEED_LINE;
        content += COMMANDS.SIZE_NORMAL;
        content += COMMANDS.ALIGN_LEFT;

        // Separator
        content += this.createSeparator('=') + COMMANDS.PAPER_FEED_LINE;

        // Receipt details
        const receiptNo = `#${Date.now().toString().slice(-6)}`;
        content += this.createLine('No. Struk:', receiptNo) + COMMANDS.PAPER_FEED_LINE;
        content += this.createLine('Tanggal:', this.formatDate(data.tanggalCetak)) + COMMANDS.PAPER_FEED_LINE;
        content += this.createLine('Waktu:', this.formatTime(data.tanggalCetak)) + COMMANDS.PAPER_FEED_LINE;
        content += this.createSeparator() + COMMANDS.PAPER_FEED_LINE;

        // Customer information
        content += COMMANDS.BOLD_ON;
        content += 'DATA PELANGGAN' + COMMANDS.PAPER_FEED_LINE;
        content += COMMANDS.BOLD_OFF;
        content += this.createLine('Nama:', data.namaPelanggan) + COMMANDS.PAPER_FEED_LINE;
        content += this.createLine('Relay:', data.relay) + COMMANDS.PAPER_FEED_LINE;
        content += this.createLine('Mode:', data.mode.toUpperCase()) + COMMANDS.PAPER_FEED_LINE;
        content += this.createSeparator() + COMMANDS.PAPER_FEED_LINE;

        // Session details
        content += COMMANDS.BOLD_ON;
        content += 'DATA SESI BERMAIN' + COMMANDS.PAPER_FEED_LINE;
        content += COMMANDS.BOLD_OFF;
        content += this.createLine('Mulai:', this.formatTime(data.waktuMulai)) + COMMANDS.PAPER_FEED_LINE;
        content += this.createLine('Selesai:', this.formatTime(data.waktuSelesai)) + COMMANDS.PAPER_FEED_LINE;
        content += this.createLine('Durasi:', data.durasi) + COMMANDS.PAPER_FEED_LINE;
        content += this.createLine('Tarif/Jam:', this.formatCurrency(data.tarifPerJam)) + COMMANDS.PAPER_FEED_LINE;
        content += this.createSeparator() + COMMANDS.PAPER_FEED_LINE;

        // Billing calculation
        content += COMMANDS.BOLD_ON;
        content += 'RINCIAN TAGIHAN' + COMMANDS.PAPER_FEED_LINE;
        content += COMMANDS.BOLD_OFF;
        content += this.createLine('Subtotal:', this.formatCurrency(data.totalBiaya)) + COMMANDS.PAPER_FEED_LINE;

        if (data.promo && data.diskon > 0) {
            content += this.createLine('Promo:', data.promo.name) + COMMANDS.PAPER_FEED_LINE;
            content += this.createLine('Potongan:', `-${this.formatCurrency(data.diskon)}`) + COMMANDS.PAPER_FEED_LINE;
        }

        // Total
        content += this.createSeparator('=') + COMMANDS.PAPER_FEED_LINE;
        content += COMMANDS.SIZE_DOUBLE_WIDTH;
        content += COMMANDS.BOLD_ON;
        content += this.createLine('TOTAL BAYAR:', this.formatCurrency(data.totalBayar), 16) + COMMANDS.PAPER_FEED_LINE;
        content += COMMANDS.SIZE_NORMAL;
        content += COMMANDS.BOLD_OFF;
        content += this.createSeparator('=') + COMMANDS.PAPER_FEED_LINE;

        // Footer
        content += COMMANDS.ALIGN_CENTER;
        content += 'Terima Kasih' + COMMANDS.PAPER_FEED_LINE;
        // content += this.centerText(`-- kasir: ${data.user} --`) + COMMANDS.PAPER_FEED_LINE;

        // Feed & cut
        content += COMMANDS.PAPER_FEED_LINE.repeat(3);
        content += COMMANDS.PAPER_CUT_PARTIAL;

        return content;
    }


    public static async printReceipt(data: PrintData): Promise<boolean> {
        try {
            // Try Web Serial API first for direct ESC/POS printing
            if ('serial' in navigator && (navigator as any).serial) {
                try {
                    return await this.printViaWebSerial(data);
                } catch (serialError) {
                    console.warn('Web Serial failed, trying alternative:', serialError);
                }
            }

            // Fallback to formatted HTML printing
            return await this.printViaWindowPrint(data);
        } catch (error) {
            console.error('Print error:', error);
            this.showPrintPreview(data);
            return true;
        }
    }

    private static async printViaWebSerial(data: PrintData): Promise<boolean> {
        try {
            const availablePorts = await (navigator as any).serial.getPorts();
            let port;

            if (availablePorts.length > 0) {
                port = availablePorts[0];
            } else {
                port = await (navigator as any).serial.requestPort({
                    filters: [
                        { usbVendorId: 0x0416 }, // CUSTOM
                        { usbVendorId: 0x04b8 }, // Epson
                        { usbVendorId: 0x0519 }, // Star Micronics
                        { usbVendorId: 0x0fe6 }, // ICS Advent
                        { usbVendorId: 0x20d1 }, // Xprinter
                        { usbVendorId: 0x1fc9 }, // NXP (some thermal printers)
                        { usbVendorId: 0x1a86 }, // QinHeng (common USB-to-serial)
                        { usbVendorId: 0x0403 }, // FTDI
                    ],
                });
            }

            // Common thermal printer serial settings
            await port.open({
                baudRate: 9600,  // Most common for thermal printers
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none',
            });

            const writer = port.writable.getWriter();
            const receiptContent = this.generateReceiptContent(data);

            // Convert to bytes - crucial for proper ESC/POS handling
            const bytes = new Uint8Array(receiptContent.length);
            for (let i = 0; i < receiptContent.length; i++) {
                bytes[i] = receiptContent.charCodeAt(i);
            }

            await writer.write(bytes);
            await writer.close();
            await port.close();

            return true;
        } catch (error) {
            console.error('Web Serial API error:', error);
            throw error;
        }
    }

    private static async printViaWindowPrint(data: PrintData): Promise<boolean> {
        const printContent = this.generateHTMLReceipt(data);
        const printWindow = window.open('', '_blank', 'width=350,height=700');

        if (!printWindow) {
            throw new Error('Could not open print window');
        }

        printWindow.document.write(printContent);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };

        return true;
    }

    private static generateHTMLReceipt(data: PrintData): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>AF RIMURU</title>
    <meta charset="utf-8">
    <style>
        @page {
            size: 58mm auto;
            margin: 2mm 1mm;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        body {
            font-family: 'Courier New', 'Courier', monospace;
            font-size: 11px;
            line-height: 1.3;
            margin: 0;
            padding: 2mm;
            width: 54mm;
            background: white;
            color: black;
        }

        .center { text-align: center; }
        .left { text-align: left; }
        .right { text-align: right; }

        .bold { font-weight: bold; }
        .normal { font-weight: normal; }

        .size-normal { font-size: 11px; }
        .size-large { font-size: 14px; }
        .size-xlarge { font-size: 16px; }

        .line-single {
            border-bottom: 1px solid #000;
            margin: 1px 0;
            height: 0;
        }
        .line-double {
            border-bottom: 2px solid #000;
            margin: 1px 0;
            height: 0;
        }
        .line-dashed {
            border-bottom: 1px dashed #000;
            margin: 1px 0;
            height: 0;
        }

        .row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin: 0;
            white-space: nowrap;
        }

        .row-left { flex: 1; text-align: left; }
        .row-right { text-align: right; }

        .section { margin: 2px 0; }
        .separator { margin: 3px 0; }

        .footer { margin-top: 4mm; }

        /* Prevent text wrapping and ensure consistent spacing */
        * {
            box-sizing: border-box;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="center bold size-xlarge">AF RIMURU</div>
    <div class="center bold size-large">PLAYPAL CAFE</div>
    <div class="line-double separator"></div>

    <div class="row">
        <span class="row-left">No. Struk:</span>
        <span class="row-right">#${Date.now().toString().slice(-6)}</span>
    </div>
    <div class="row">
        <span class="row-left">Tanggal:</span>
        <span class="row-right">${this.formatDate(data.tanggalCetak)}</span>
    </div>
    <div class="row">
        <span class="row-left">Waktu:</span>
        <span class="row-right">${this.formatTime(data.tanggalCetak)}</span>
    </div>
    <div class="line-single separator"></div>

    <div class="bold section">DATA PELANGGAN</div>
    <div class="row">
        <span class="row-left">Nama:</span>
        <span class="row-right">${data.namaPelanggan}</span>
    </div>
    <div class="row">
        <span class="row-left">Relay:</span>
        <span class="row-right">${data.relay}</span>
    </div>
    <div class="row">
        <span class="row-left">Mode:</span>
        <span class="row-right">${data.mode.toUpperCase()}</span>
    </div>
    <div class="line-single separator"></div>

    <div class="bold section">DATA SESI BERMAIN</div>
    <div class="row">
        <span class="row-left">Mulai:</span>
        <span class="row-right">${this.formatTime(data.waktuMulai)}</span>
    </div>
    <div class="row">
        <span class="row-left">Selesai:</span>
        <span class="row-right">${this.formatTime(data.waktuSelesai)}</span>
    </div>
    <div class="row">
        <span class="row-left">Durasi:</span>
        <span class="row-right">${data.durasi}</span>
    </div>
    <div class="row">
        <span class="row-left">Tarif/Jam:</span>
        <span class="row-right">${this.formatCurrency(data.tarifPerJam)}</span>
    </div>
    <div class="line-single separator"></div>

    <div class="bold section">RINCIAN TAGIHAN</div>
    <div class="row">
        <span class="row-left">Subtotal:</span>
        <span class="row-right">${this.formatCurrency(data.totalBiaya)}</span>
    </div>

    ${data.promo && data.diskon > 0 ? `
    <div class="row">
        <span class="row-left">Promo:</span>
        <span class="row-right">${data.promo.name}</span>
    </div>
    <div class="row">
        <span class="row-left">Potongan:</span>
        <span class="row-right">-${this.formatCurrency(data.diskon)}</span>
    </div>
    ` : ''}

    <div class="line-double separator"></div>
    <div class="row bold size-large">
        <span class="row-left">TOTAL BAYAR:</span>
        <span class="row-right">${this.formatCurrency(data.totalBayar)}</span>
    </div>
    <div class="line-double separator"></div>

    <div class="center footer">
        <div class="section">Terima Kasih</div>
        <br>
        </div>
        </body>
        </html>`;
    }
    // <div class="size-normal">-- kasir: ${data.user} --</div>

    private static showPrintPreview(data: PrintData): void {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; justify-content: center;
            align-items: center; z-index: 9999; backdrop-filter: blur(2px);
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 20px; border-radius: 12px;
            max-width: 400px; max-height: 85vh; overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        // Clean receipt content for preview
        const receiptText = this.generateReceiptContent(data)
            .replace(/[\x00-\x1F\x7F-\xFF]/g, '') // Remove all control chars
            .split('\n')
            .filter(line => line.trim()) // Remove empty lines
            .join('<br>');

        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #333;">Preview Struk</h3>
                <button onclick="this.closest('[style*=fixed]').remove()"
                        style="background: #dc3545; color: white; border: none;
                               border-radius: 50%; width: 30px; height: 30px;
                               cursor: pointer; font-size: 18px; line-height: 1;">×</button>
            </div>

            <div style="font-family: 'Courier New', monospace; font-size: 11px;
                        background: #f8f9fa; padding: 15px; border-radius: 6px;
                        border: 2px dashed #dee2e6; max-height: 400px; overflow-y: auto;">
                ${receiptText || 'Preview tidak tersedia'}
            </div>

            <div style="margin-top: 15px; text-align: center;">
                <button onclick="window.print()"
                        style="margin-right: 10px; padding: 10px 20px; background: #007bff;
                               color: white; border: none; border-radius: 6px; cursor: pointer;
                               font-weight: 500;">
                    🖨️ Print Sekarang
                </button>
                <button onclick="this.closest('[style*=fixed]').remove()"
                        style="padding: 10px 20px; background: #6c757d; color: white;
                               border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Tutup
                </button>
            </div>

            <div style="margin-top: 10px; font-size: 12px; color: #6c757d; text-align: center;">
                💡 Tip: Gunakan printer thermal untuk hasil terbaik
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Keyboard shortcut
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    // Enhanced utility methods
    public static async isSupported(): Promise<boolean> {
        if ('serial' in navigator && (navigator as any).serial) return true;
        if (typeof window !== 'undefined' && typeof window.print === 'function') return true;
        return false;
    }

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
