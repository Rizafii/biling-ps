'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
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
    status: 'idle' | 'on' | 'off';
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
    paket_id?: string;
}

interface ModalSetPortProps {
    isOpen: boolean;
    onClose: () => void;
    port: Port;
    onUpdatePort: (updated: Port) => void;
    timeFormat: (t: number) => string;
    controlRelay?: (deviceId: string, pin: number, status: boolean) => Promise<void>;
    currentUserId?: number; // Add current user ID prop
}

export function ModalSetPort({ isOpen, onClose, port, onUpdatePort, timeFormat, controlRelay, currentUserId }: ModalSetPortProps) {
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [portData, setPortData] = useState({
        customer: '',
        hourlyRate: '',
        promoScheme: '',
        mode: 'timed' as 'timed' | 'bebas',
        hours: '',
        minutes: '',
        selectedPackageId: ''
    });
    const [packageList, setPackageList] = useState<{ id: string; name: string; harga: number; duration: number }[]>([]);

    // Ambil daftar paket saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            fetch('/api/paket')
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data.paket)) {
                        setPackageList(data.paket);
                    }
                })
                .catch((err) => console.error('Gagal load paket:', err));
        }
    }, [isOpen]);

    const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

    const resetFormData = () => {
        setPortData({
            customer: '',
            hourlyRate: '',
            promoScheme: 'tanpa-promo',
            mode: 'timed',
            hours: '',
            minutes: '',
            selectedPackageId: ''
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
                        selectedPackageId: port.paket_id || ''
                    });
                }
            }
        }
    }, [isOpen, port, isFormDirty]);
    console.log(port.paket_id);


    function jamMenitToDetik(hours: string, minutes: string): number {
        const h = parseInt(hours || '0', 10);
        const m = parseInt(minutes || '0', 10);
        return h * 3600 + m * 60;
    }

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

        console.log('Starting billing with user_id:', currentUserId); // Debug log

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

        if (controlRelay && port.pin && port.device) {
            try {
                await controlRelay(port.device, port.pin, true);
            } catch (error) {
                console.error('Error controlling relay:', error);
                alert('Gagal mengontrol relay. Coba lagi.');
                return;
            }
        }

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
                    paket_id: portData.selectedPackageId || null,
                    user_id: currentUserId || 1, // Include user_id from prop
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
                paket_id: portData.selectedPackageId,
            };

            onUpdatePort(updatedPort);
        } catch (error) {
            console.error('Error creating billing record:', error);
            alert('Gagal membuat record billing. Namun relay sudah menyala.');
        }

        setIsFormDirty(false);
        onClose();
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

                    {/* Nama & Tarif */}
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
                        {/* Tarif/Jam */}
                        <div>
                            <Label htmlFor="rate">Tarif/Jam</Label>
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
                                    disabled={port.status !== 'idle' || !!portData.selectedPackageId} // ✅ Disable kalau pilih paket
                                    className={cn(
                                        'rounded-l-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                                        port.status !== 'idle' || !!portData.selectedPackageId
                                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                            : ''
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

                    {/* Paket */}
                    {portData.mode === 'timed' && (
                        <div>
                            <Label htmlFor="paket">Pilih Paket</Label>
                            <Select
                                value={portData.selectedPackageId || "none"}
                                disabled={port.status !== 'idle'}
                                onValueChange={(val) => {
                                    if (val === "none") {
                                        // ❌ batal pilih paket → reset value
                                        setPortData((prev) => ({
                                            ...prev,
                                            selectedPackageId: '',
                                            hours: '',
                                            minutes: '',
                                            hourlyRate: '',
                                        }));
                                        setIsFormDirty(true);
                                        return;
                                    }

                                    const selected = packageList.find(p => p.id === val);
                                    if (selected) {
                                        setPortData(prev => {
                                            const durasiJam = selected.duration / 60;
                                            const hargaTotal = selected.harga;
                                            const tarifPerJam = durasiJam > 0 ? hargaTotal / durasiJam : hargaTotal;

                                            return {
                                                ...prev,
                                                selectedPackageId: selected.id,
                                                hours: Math.floor(selected.duration / 60).toString(),
                                                minutes: (selected.duration % 60).toString(),
                                                hourlyRate: Math.round(tarifPerJam).toLocaleString("id-ID"),
                                            };
                                        });
                                        setIsFormDirty(true);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Paket" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Tanpa Paket --</SelectItem> {/* ✅ aman */}
                                    {packageList.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} - Rp {p.harga.toLocaleString('id-ID')} ({Math.floor(p.duration / 60)}j {p.duration % 60}m)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>


                        </div>
                    )}

                    {/* Input Jam & Menit */}
                    {portData.mode === 'timed' && (
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
                                    disabled={port.status !== 'idle' || !!portData.selectedPackageId} // ✅
                                    className={port.status !== 'idle' || !!portData.selectedPackageId
                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        : ''}
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
                                    disabled={port.status !== 'idle' || !!portData.selectedPackageId} // ✅
                                    className={port.status !== 'idle' || !!portData.selectedPackageId
                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        : ''}
                                />
                            </div>
                        </div>
                    )}



                    {/* Promo */}
                    {/* <div>
                        <Label htmlFor="promo">Promo</Label>
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
                    </div> */}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {/* {port.status === 'off' ? ( */}
                            {/* <div className="flex-1 text-center font-semibold text-red-500">Port Sedang Off</div> */}
                        {/* ) : port.status === 'idle' ? ( */}
                            <Button onClick={handleStart} className="flex-1 bg-blue-500 hover:bg-blue-600">
                                <Play className="mr-2 h-4 w-4" /> Mulai
                            </Button>
                        {/* // ) : (
                        //     <div className="flex-1 text-center font-semibold text-green-600">Port Sedang Berjalan</div>
                        // )} */}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
