'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AlertTriangle, FileText, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Port {
    id: string;
    device: string;
    device_name?: string;
    no_port: string;
    nama_port: string;
    pin?: number;
    type: string; // t = timed, b = bebas, "" = undefined
    nama_pelanggan: string;
    duration: string; // "HH:MM:SS"
    price: string;
    status: 'idle' | 'on' | 'pause' | 'off';
    time: number;
    total: number;
    billing: number;
    subtotal: number;
    diskon: number;
    promoList: { id: string; label: string }[];
    mode: 'timed' | 'bebas';
    hours: string;
    minutes: string;
    promoScheme: string;
    device_status?: 'online' | 'offline';
    last_heartbeat?: string;
    server_time?: number;
    start_time?: number;
}

interface ModalSetPortProps {
    isOpen: boolean;
    onClose: () => void;
    port: Port;
    onUpdatePort: (updated: Port) => void;
    timeFormat: (t: number) => string;
    controlRelay?: (deviceId: string, pin: number, status: boolean) => Promise<void>;
}

export function ModalSetPort({ isOpen, onClose, port, onUpdatePort, timeFormat, controlRelay }: ModalSetPortProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [portData, setPortData] = useState({
        customer: '',
        hourlyRate: '',
        promoScheme: '',
        mode: 'timed' as 'timed' | 'bebas',
        hours: '',
        minutes: '',
    });

    // Get current timestamp for server time calculations
    const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

    // Reset form data when modal opens
    const resetFormData = () => {
        setPortData({
            customer: '',
            hourlyRate: '',
            promoScheme: 'tanpa-promo',
            mode: 'timed',
            hours: '',
            minutes: '',
        });
        setIsFormDirty(false);
    };

    useEffect(() => {
        if (isOpen && port) {
            if (!isFormDirty) {
                if (port.status === 'idle') {
                    resetFormData();
                } else {
                    setPortData({
                        customer: port.nama_pelanggan || '',
                        hourlyRate: port.price || '',
                        promoScheme: port.promoScheme || 'tanpa-promo',
                        mode: port.mode,
                        hours: port.hours || '',
                        minutes: port.minutes || '',
                    });
                }
            }
        }
    }, [isOpen, port, isFormDirty]);

    // Convert jam dan menit ke detik
    function jamMenitToDetik(hours: string, minutes: string): number {
        const h = parseInt(hours || '0', 10);
        const m = parseInt(minutes || '0', 10);
        return h * 3600 + m * 60;
    }

    // Hitung total berdasarkan tarif per jam
    function hitungTotal(hourlyRate: string, timeInSeconds: number, mode: string): number {
        const tarif = parseInt(hourlyRate.replace(/\./g, '')) || 0;

        if (mode === 'timed') {
            return 0; // Untuk timed, total dihitung saat countdown
        } else {
            // Untuk bebas, hitung berdasarkan waktu yang sudah berjalan
            const jam = timeInSeconds / 3600;
            let total = Math.round(tarif * jam);

            // Pembulatan ke atas ke 100 terdekat
            const sisa = total % 100;
            if (sisa !== 0) total = total + (100 - sisa);

            return total;
        }
    }

    const handleStart = async () => {
        if (!portData.customer.trim()) {
            alert('Nama pelanggan wajib diisi');
            return;
        }
        if (!portData.hourlyRate) {
            alert('Tarif per jam wajib diisi');
            return;
        }

        let totalSeconds = 0;
        let billingSeconds = 0;

        if (portData.mode === 'timed') {
            totalSeconds = jamMenitToDetik(portData.hours, portData.minutes);
            billingSeconds = totalSeconds;
            if (totalSeconds <= 0) {
                alert('Jam atau menit harus diisi untuk mode timed');
                return;
            }
        }

        // Control relay ON (status true = aliran nyala)
        if (controlRelay && port.pin && port.device) {
            try {
                await controlRelay(port.device, port.pin, true);
            } catch (error) {
                console.error('Error controlling relay:', error);
                alert('Gagal mengontrol relay. Coba lagi.');
                return;
            }
        }

        // Create billing record in database
        try {
            let durasi = null;
            if (portData.mode === 'timed') {
                const hours = parseInt(portData.hours || '0', 10);
                const minutes = parseInt(portData.minutes || '0', 10);
                durasi = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
            }

            const response = await fetch('/api/billing/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    device_id: port.device,
                    pin: port.pin,
                    nama_pelanggan: portData.customer,
                    mode: portData.mode === 'timed' ? 'timer' : 'bebas',
                    tarif_perjam: parseInt(portData.hourlyRate.replace(/\./g, '')) || 0,
                    promo_id: portData.promoScheme !== 'tanpa-promo' ? portData.promoScheme : null,
                    durasi: durasi,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to create billing record');
            }

            console.log('Billing started successfully:', result);

            // Get current server time for start_time
            const startTime = getCurrentTimestamp();

            const updatedPort: Port = {
                ...port,
                nama_pelanggan: portData.customer,
                price: portData.hourlyRate,
                promoScheme: portData.promoScheme,
                mode: portData.mode,
                hours: portData.hours,
                minutes: portData.minutes,
                type: portData.mode === 'timed' ? 't' : 'b',
                status: 'on',
                time: totalSeconds,
                billing: billingSeconds,
                total: hitungTotal(portData.hourlyRate, totalSeconds, portData.mode),
                subtotal: hitungTotal(portData.hourlyRate, totalSeconds, portData.mode),
                diskon: 0,
                start_time: startTime, // Set start time for accurate timer
            };

            onUpdatePort(updatedPort);
        } catch (error) {
            console.error('Error creating billing record:', error);
            alert('Gagal membuat record billing. Namun relay sudah menyala.');
        }

        setIsFormDirty(false);
        onClose();
    };

    const handlePause = () => {
        onUpdatePort({
            ...port,
            status: port.status === 'pause' ? 'on' : 'pause',
        });
    };

    const handleFinish = async () => {
        // Calculate total biaya and durasi for billing stop
        let detikDipakai = 0;
        if (port.start_time) {
            // Use server-time based calculation
            const currentTime = getCurrentTimestamp();
            detikDipakai = Math.max(0, currentTime - port.start_time);
        } else {
            // Fallback to current time value
            detikDipakai = port.type === 'b' ? port.time : port.billing - port.time;
        }

        const totalBiaya = hitungTotal(port.price, detikDipakai, port.type === 't' ? 'timed' : 'bebas');
        let durasi = null;

        if (port.type === 'b') {
            // bebas mode - use actual elapsed time
            const hours = Math.floor(detikDipakai / 3600);
            const minutes = Math.floor((detikDipakai % 3600) / 60);
            const seconds = detikDipakai % 60;
            durasi = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Control relay OFF (status false = aliran mati)
        if (controlRelay && port.pin && port.device) {
            try {
                await controlRelay(port.device, port.pin, false);
            } catch (error) {
                console.error('Error controlling relay:', error);
                alert('Gagal mengontrol relay. Coba lagi.');
                return;
            }
        }

        // Call API to stop billing
        try {
            const response = await fetch('/api/billing/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    device_id: port.device,
                    pin: port.pin,
                    total_biaya: totalBiaya,
                    durasi: durasi,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Billing stopped successfully:', result);
            } else {
                console.error('Failed to stop billing:', result.message);
                alert('Gagal menghentikan billing di database.');
            }
        } catch (error) {
            console.error('Error stopping billing:', error);
            alert('Gagal menghentikan billing di database. Namun relay sudah dimatikan.');
        }

        // Set port ke idle dan reset semua data
        const finishedPort: Port = {
            ...port,
            nama_pelanggan: '',
            price: '',
            status: 'idle',
            time: 0,
            billing: 0,
            total: 0,
            subtotal: 0,
            diskon: 0,
            hours: '0',
            minutes: '0',
            type: '',
            promoScheme: 'tanpa-promo',
            mode: 'timed',
            start_time: undefined,
        };

        onUpdatePort(finishedPort);
        resetFormData();
        onClose();
    };

    const handleReset = () => {
        // Reset port dan form data
        const resetPort: Port = {
            ...port,
            nama_pelanggan: '',
            price: '',
            status: 'idle',
            time: 0,
            billing: 0,
            total: 0,
            subtotal: 0,
            diskon: 0,
            hours: '0',
            minutes: '0',
            type: '',
            promoScheme: 'tanpa-promo',
            mode: 'timed',
            start_time: undefined,
        };

        onUpdatePort(resetPort);
        resetFormData();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    setIsFormDirty(false);
                }
                onClose();
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="mr-4 flex items-center justify-between">
                        <span>{port.nama_port}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{port.status}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Duration & Total */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm text-gray-600">Durasi</Label>
                            <div className="font-mono text-2xl font-bold">{timeFormat(port.time)}</div>
                        </div>
                        <div className="text-right">
                            <Label className="text-sm text-gray-600">Total</Label>
                            <div className="text-2xl font-bold">Rp {port.total.toLocaleString('id-ID')}</div>
                        </div>
                    </div>

                    {/* Customer & Rate */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="customer">Pelanggan</Label>
                            <Input
                                id="customer"
                                placeholder="Nama / Kode"
                                value={portData.customer}
                                onChange={(e) => {
                                    setPortData((prev) => ({ ...prev, customer: e.target.value }));
                                    setIsFormDirty(true);
                                }}
                                disabled={port.status !== 'idle'}
                                className={port.status !== 'idle' ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}
                            />
                        </div>
                        <div>
                            <Label htmlFor="rate">Tarif per Jam</Label>
                            <div className="flex items-center rounded-md border pl-3">
                                <span className="pr-2 text-gray-500">Rp</span>
                                <Input
                                    id="rate"
                                    type="text"
                                    placeholder="0"
                                    value={portData.hourlyRate}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                        setPortData((prev) => ({ ...prev, hourlyRate: formatted }));
                                        setIsFormDirty(true);
                                    }}
                                    disabled={port.status !== 'idle'}
                                    className={cn(
                                        'rounded-l-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                                        port.status !== 'idle' ? 'cursor-not-allowed bg-gray-100 text-gray-400' : '',
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mode */}
                    <div>
                        <Label htmlFor="mode">Mode</Label>
                        <Select
                            value={portData.mode}
                            onValueChange={(val) => {
                                setPortData((prev) => ({ ...prev, mode: val as 'timed' | 'bebas' }));
                                setIsFormDirty(true);
                            }}
                            disabled={port.status !== 'idle'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="timed">Timed</SelectItem>
                                <SelectItem value="bebas">Bebas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Time Input */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="hours">Jam</Label>
                            <Input
                                id="hours"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                maxLength={2}
                                value={portData.hours}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setPortData((prev) => ({ ...prev, hours: value }));
                                    setIsFormDirty(true);
                                }}
                                disabled={portData.mode === 'bebas' || port.status !== 'idle'}
                                className={portData.mode === 'bebas' || port.status !== 'idle' ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}
                            />
                        </div>
                        <div>
                            <Label htmlFor="minutes">Menit</Label>
                            <Input
                                id="minutes"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                maxLength={2}
                                value={portData.minutes}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    const numValue = parseInt(value || '0', 10);
                                    if (numValue <= 59) {
                                        setPortData((prev) => ({ ...prev, minutes: value }));
                                        setIsFormDirty(true);
                                    }
                                }}
                                disabled={portData.mode === 'bebas' || port.status !== 'idle'}
                                className={portData.mode === 'bebas' || port.status !== 'idle' ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}
                            />
                        </div>
                    </div>

                    {/* Promo */}
                    <div>
                        <Label htmlFor="promo">Skema Promo</Label>
                        <Select
                            value={portData.promoScheme}
                            onValueChange={(val) => {
                                setPortData((prev) => ({ ...prev, promoScheme: val }));
                                setIsFormDirty(true);
                            }}
                            disabled={port.status !== 'idle'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih promo" />
                            </SelectTrigger>
                            <SelectContent>
                                {port.promoList.map((promo) => (
                                    <SelectItem key={promo.id} value={promo.id}>
                                        {promo.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {port.status === 'off' ? (
                            <div className="flex-1 text-center font-semibold text-red-500">Port Sedang Off</div>
                        ) : port.status === 'idle' ? (
                            <Button onClick={handleStart} className="flex-1 bg-blue-500 hover:bg-blue-600">
                                <Play className="mr-2 h-4 w-4" />
                                Mulai
                            </Button>
                        ) : (
                            <>
                                {port.status === 'pause' ? (
                                    <Button onClick={handlePause} className="flex-1 bg-green-500 hover:bg-green-600">
                                        <Play className="mr-2 h-4 w-4" />
                                        Resume
                                    </Button>
                                ) : (
                                    <Button onClick={() => setConfirmOpen(true)} className="flex-1 bg-yellow-500 hover:bg-yellow-600">
                                        <Pause className="mr-2 h-4 w-4" />
                                        Pause
                                    </Button>
                                )}
                                <Button onClick={handleFinish} className="flex-1 bg-green-500 hover:bg-green-600">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Selesai & Nota
                                </Button>
                                <Button variant="outline" onClick={handleReset} className="bg-transparent px-6">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between border-t pt-2 text-sm text-gray-600">
                        <span>
                            Billable: {Math.floor(port.billing / 60)}:{(port.billing % 60).toString().padStart(2, '0')}
                        </span>
                        <span>Subtotal: Rp {port.subtotal.toLocaleString('id-ID')}</span>
                        <span>Diskon: Rp {port.diskon.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </DialogContent>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-yellow-50 p-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <DialogTitle className="text-lg font-semibold">Konfirmasi Pause</DialogTitle>
                        </div>
                        <DialogDescription className="mt-3 text-sm text-muted-foreground">
                            Apakah Anda yakin ingin mem-pause {port.no_port}?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 rounded-md border border-yellow-100 bg-orange-50 p-3">
                        <p className="text-sm font-medium text-yellow-800">Peringatan</p>
                        <p className="mt-1 text-sm text-yellow-700">
                            Jika <span className="font-semibold">dipause</span>, maka relay akan
                            <span className="font-semibold text-red-700"> mati</span> yang berakibat listrik
                            <span className="font-semibold text-red-700"> mati</span>.
                        </p>
                    </div>

                    <DialogFooter className="mt-6">
                        <div className="flex w-full justify-end gap-2">
                            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                                Batal
                            </Button>
                            <Button
                                onClick={() => {
                                    onUpdatePort({ ...port, status: 'pause' });
                                    setConfirmOpen(false);
                                }}
                            >
                                Lanjutkan
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
