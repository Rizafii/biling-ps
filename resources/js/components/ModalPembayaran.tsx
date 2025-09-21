import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Promo {
    id: number;
    name: string;
    code: string | null;
    type: 'flat' | 'percent' | 'time';
    value: number;
    min_duration: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface EspRelay {
    id: number;
    nama_relay: string;
    created_at: string;
    updated_at: string;
}

interface Billing {
    id: number;
    esp_relay_id: number;
    promo_id: number | null;
    nama_pelanggan: string;
    mode: 'bebas' | 'timer';
    status: 'aktif' | 'selesai' | 'sudah_bayar';
    tarif_perjam: number;
    total_biaya: number;
    total_setelah_promo?: number | null;
    durasi: number | string | null;
    waktu_mulai: string;
    waktu_selesai: string | null;
    created_at: string;
    updated_at: string;
    promo?: Promo | null;
    esp_relay?: EspRelay | null;
}

interface ModalPembayaranProps {
    isOpen: boolean;
    onClose: () => void;
    billing: Billing | null;
    promos: Promo[];
}

export default function ModalPembayaran({ isOpen, onClose, billing, promos }: ModalPembayaranProps) {
    const [selectedPromoId, setSelectedPromoId] = useState<string>('no-promo');
    const [isProcessing, setIsProcessing] = useState(false);
    const [calculatedTotal, setCalculatedTotal] = useState<number>(0);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen && billing) {
            setSelectedPromoId('no-promo');
            setCalculatedTotal(billing.total_biaya);
        }
    }, [isOpen, billing]);

    // Calculate total when promo selection changes
    useEffect(() => {
        if (!billing) return;

        if (selectedPromoId && selectedPromoId !== 'no-promo') {
            const selectedPromo = promos.find((p) => p.id.toString() === selectedPromoId);
            if (selectedPromo && selectedPromo.is_active) {
                calculateDiscountedTotal(selectedPromo, billing);
            } else {
                setCalculatedTotal(billing.total_biaya);
            }
        } else {
            setCalculatedTotal(billing.total_biaya);
        }
    }, [selectedPromoId, billing, promos]);

    const calculateDiscountedTotal = (promo: Promo, billing: Billing) => {
        const totalBiaya = billing.total_biaya;

        // Calculate duration in minutes
        let durasiMenit = 0;
        if (billing.durasi) {
            if (typeof billing.durasi === 'string') {
                const parts = billing.durasi.split(':');
                durasiMenit = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            } else {
                durasiMenit = billing.durasi;
            }
        }

        // Check minimum duration requirement
        if (promo.min_duration && durasiMenit < promo.min_duration) {
            setCalculatedTotal(totalBiaya);
            return;
        }

        let discount = 0;
        switch (promo.type) {
            case 'flat':
                discount = promo.value;
                break;
            case 'percent':
                discount = totalBiaya * (promo.value / 100);
                break;
            case 'time':
                // Free time in minutes - convert to cost based on hourly rate
                const waktuGratisMenit = promo.value;
                discount = (waktuGratisMenit / 60) * billing.tarif_perjam;
                break;
        }

        const totalAfterDiscount = Math.max(0, totalBiaya - discount);
        setCalculatedTotal(totalAfterDiscount);
    };

    const handlePayment = async () => {
        if (!billing) return;

        setIsProcessing(true);

        router.post(
            `/histori/${billing.id}/pay`,
            {
                promo_id: selectedPromoId === 'no-promo' ? null : selectedPromoId || null,
            },
            {
                onSuccess: (page) => {
                    // Success handled by Inertia
                    onClose();
                    router.reload({ only: ['data'] });
                },
                onError: (errors) => {
                    console.error('Payment error:', errors);
                    if (errors.message) {
                        alert(errors.message);
                    } else {
                        alert('Terjadi kesalahan saat memproses pembayaran');
                    }
                },
                onFinish: () => {
                    setIsProcessing(false);
                },
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDuration = (durasi: number | string | null) => {
        if (!durasi) return '0 menit';

        if (typeof durasi === 'string') {
            return durasi;
        }

        const hours = Math.floor(durasi / 60);
        const minutes = durasi % 60;

        if (hours > 0) {
            return `${hours} jam ${minutes} menit`;
        }
        return `${minutes} menit`;
    };

    if (!billing) return null;

    const activePromos = promos.filter((p) => p.is_active);
    const selectedPromo = selectedPromoId && selectedPromoId !== 'no-promo' ? promos.find((p) => p.id.toString() === selectedPromoId) : null;
    const discountAmount = billing.total_biaya - calculatedTotal;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Proses Pembayaran</DialogTitle>
                    <DialogDescription>Pilih promo dan konfirmasi pembayaran untuk billing ini</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Billing Info */}
                    <Card>
                        <CardContent className="space-y-2 p-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Pelanggan:</span>
                                <span className="font-medium">{billing.nama_pelanggan}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Relay:</span>
                                <span>{billing.esp_relay?.nama_relay || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Mode:</span>
                                <Badge variant="outline">{billing.mode}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Durasi:</span>
                                <span>{formatDuration(billing.durasi)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Tarif/Jam:</span>
                                <span>{formatCurrency(billing.tarif_perjam)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Promo Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="promo">Pilih Promo (Opsional)</Label>
                        <Select value={selectedPromoId} onValueChange={setSelectedPromoId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tanpa promo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-promo">Tanpa promo</SelectItem>
                                {activePromos.map((promo) => (
                                    <SelectItem key={promo.id} value={promo.id.toString()}>
                                        <div className="flex flex-col">
                                            <span>{promo.name}</span>
                                            {promo.code && <span className="text-xs text-muted-foreground">Kode: {promo.code}</span>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Selected Promo Info */}
                    {selectedPromo && (
                        <Card className="bg-blue-50 dark:bg-blue-950">
                            <CardContent className="p-3">
                                <div className="space-y-1 text-sm">
                                    <div className="font-medium text-blue-900 dark:text-blue-100">{selectedPromo.name}</div>
                                    <div className="text-blue-700 dark:text-blue-300">
                                        {selectedPromo.type === 'flat' && `Diskon ${formatCurrency(selectedPromo.value)}`}
                                        {selectedPromo.type === 'percent' && `Diskon ${selectedPromo.value}%`}
                                        {selectedPromo.type === 'time' && `Gratis ${selectedPromo.value} menit`}
                                    </div>
                                    {selectedPromo.min_duration && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400">
                                            Minimal durasi: {selectedPromo.min_duration} menit
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />

                    {/* Payment Summary */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Total Biaya:</span>
                            <span>{formatCurrency(billing.total_biaya)}</span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Diskon:</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}

                        <Separator />

                        <div className="flex justify-between text-lg font-semibold">
                            <span>Total Bayar:</span>
                            <span className="text-primary">{formatCurrency(calculatedTotal)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Batal
                    </Button>
                    <Button onClick={handlePayment} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                        {isProcessing ? 'Memproses...' : 'Bayar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
