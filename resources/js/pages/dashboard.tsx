'use client';

import { ModalSetPort } from '@/components/ModalSetPort';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, ChevronDown, ChevronUp, Pause, Play, Settings } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

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
    time: number; // dalam menit atau detik, sesuai format timeFormat
    total: number;
    billing: number; // menit
    subtotal: number;
    diskon: number;
    promoList: { id: string; label: string }[];
    mode: 'timed' | 'bebas';
    hours: string;
    minutes: string;
    promoScheme: string;
    device_status?: 'online' | 'offline';
    last_heartbeat?: string;
}
export default function Dashboard() {
    const timeFormat = (t: number) => {
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = t % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const [portsData, setPortsData] = useState<Port[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<'nama_pelanggan' | 'duration' | null>(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [selectedPort, setSelectedPort] = useState<Port | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Fetch ports data from API
    const fetchPorts = useCallback(
        async (showLoading = false) => {
            try {
                if (showLoading) {
                    setIsLoading(true);
                }

                const response = await fetch('/api/ports', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success && Array.isArray(result.ports)) {
                    // Merge with existing ports data to preserve user-set values
                    setPortsData((prevPorts) => {
                        const newPorts = result.ports.map((apiPort: any) => {
                            const existingPort = prevPorts.find((p) => p.id === apiPort.id);

                            if (existingPort) {
                                // Keep user-set values but update device status
                                return {
                                    ...existingPort,
                                    device: apiPort.device,
                                    device_name: apiPort.device_name,
                                    device_status: apiPort.device_status,
                                    last_heartbeat: apiPort.last_heartbeat,
                                    status: apiPort.device_status === 'offline' ? 'off' : existingPort.status,
                                };
                            } else {
                                // New port from API with default values
                                return {
                                    ...apiPort,
                                    promoList: [{ id: 'tanpa-promo', label: 'Tanpa Promo' }],
                                    mode: 'timed' as const,
                                    hours: '0',
                                    minutes: '0',
                                    promoScheme: 'tanpa-promo',
                                };
                            }
                        });

                        return newPorts;
                    });

                    setLastUpdate(new Date());
                } else {
                    console.warn('Invalid response format:', result);
                }
            } catch (error) {
                console.error('Error fetching ports:', error);
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        },
        [], // ✅ Remove portsData dependency to avoid infinite loop
    );

    // Function to check expired timed billings
    const checkExpiredBillings = useCallback(async () => {
        try {
            const response = await fetch('/api/billing/check-expired', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.stopped_billings.length > 0) {
                    // Auto turn off relays for expired billings
                    for (const billing of result.stopped_billings) {
                        await controlRelay(billing.device_id, billing.pin, false);

                        // Update local state immediately to clear customer data
                        const portId = `${billing.device_id}_${billing.pin}`;
                        setPortsData((prev) =>
                            prev.map((p) => {
                                if (p.id === portId) {
                                    return {
                                        ...p,
                                        status: 'idle',
                                        type: '',
                                        nama_pelanggan: '',
                                        time: 0,
                                        billing: 0,
                                        total: 0,
                                        subtotal: 0,
                                        price: '',
                                        hours: '0',
                                        minutes: '0',
                                        promoScheme: 'tanpa-promo',
                                        mode: 'timed',
                                    };
                                }
                                return p;
                            }),
                        );
                    }
                    console.log(`Auto-stopped ${result.expired_count} expired billings`);
                }
            }
        } catch (error) {
            console.error('Error checking expired billings:', error);
        }
    }, []);

    // Auto-refresh ports setiap 5 detik
    useEffect(() => {
        // Initial load
        fetchPorts(true);

        const interval = setInterval(() => {
            // ✅ Skip auto-refresh jika modal sedang terbuka
            if (!modalOpen && !modalConfirmOpen) {
                fetchPorts(false); // Auto refresh tanpa loading indicator
                checkExpiredBillings(); // Check for expired timed billings
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [modalOpen, modalConfirmOpen, checkExpiredBillings]);

    const handleUpdatePort = (updated: Port) => {
        setPortsData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    };

    // Function untuk mengontrol relay dari dashboard
    const controlRelay = async (deviceId: string, pin: number, status: boolean) => {
        try {
            const response = await fetch('/api/relay/control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    device_id: deviceId,
                    pin: pin,
                    status: status, // true = aliran ON, false = aliran OFF
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Relay controlled successfully:', result);
                // Update port status immediately untuk feedback visual
                setPortsData((prev) =>
                    prev.map((port) => {
                        if (port.device === deviceId && port.pin === pin) {
                            return {
                                ...port,
                                status: status ? 'on' : 'idle', // Update visual status
                            };
                        }
                        return port;
                    }),
                );
            } else {
                console.error('Failed to control relay:', result.message);
            }
        } catch (error) {
            console.error('Error controlling relay:', error);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setPortsData((prev) =>
                prev.map((port) => {
                    if (port.status === 'on') {
                        if (port.type === 't') {
                            if (port.time > 0) {
                                const newTime = port.time - 1;
                                return {
                                    ...port,
                                    time: newTime,
                                    total: hitungTotal(port.price, port.billing, newTime, port.type),
                                };
                            } else {
                                return { ...port, status: 'off', time: 0 };
                            }
                        } else if (port.type === 'b') {
                            const newTime = port.time + 1;
                            return {
                                ...port,
                                time: newTime,
                                total: hitungTotal(port.price, port.billing, newTime, port.type),
                            };
                        }
                    }

                    // Always return the port object if no changes
                    return port;
                }),
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    function hitungTotal(price: string, billing: number, time: number, type: string) {
        const tarif = parseInt(price.replace(/\./g, '')) || 0;

        let detikDipakai = 0;

        if (type === 't') {
            // Mode timed: hitung dari billing - time (sisa waktu)
            detikDipakai = billing - time;
        } else if (type === 'b') {
            // Mode bebas: hitung dari waktu yang sudah berjalan
            detikDipakai = time;
        }

        if (detikDipakai < 0) detikDipakai = 0;

        // ✅ Konversi detik ke jam untuk perhitungan
        const jam = detikDipakai / 3600; // Convert seconds to hours
        let total = Math.round(tarif * jam);

        // Pembulatan ke atas ke 100 terdekat
        const sisa = total % 100;
        if (sisa !== 0) total = total + (100 - sisa);

        return total;
    }

    // Toggle status port hanya untuk "on" dan "pause"
    const togglePortStatus = async (port: Port) => {
        if (port.status === 'idle') {
            // Jika idle, hanya buka modal
            setSelectedPort(port);
            setModalOpen(true);
            return;
        }

        if (port.status === 'on') {
            // Jika ON, pause dahulu (hanya update UI, tidak control relay)
            setPortsData((prev) =>
                prev.map((p) => {
                    if (p.id === port.id) {
                        return { ...p, status: 'pause' };
                    }
                    return p;
                }),
            );
        } else if (port.status === 'pause') {
            // Jika PAUSE, resume ke ON (tidak control relay karena relay tetap on)
            setPortsData((prev) =>
                prev.map((p) => {
                    if (p.id === port.id) {
                        return { ...p, status: 'on' };
                    }
                    return p;
                }),
            );
        }
    };

    // Function untuk benar-benar mematikan relay (stop billing)
    const stopBilling = async (port: Port) => {
        if (port.pin && port.device) {
            // Control relay untuk OFF (status false = aliran mati)
            await controlRelay(port.device, port.pin, false);

            // Calculate total biaya and durasi for billing stop
            const totalBiaya = hitungTotal(port.price, port.billing, port.time, port.type);
            let durasi = null;

            if (port.type === 'b') {
                // bebas mode
                // Convert seconds to HH:MM:SS format
                const totalSeconds = port.time;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                durasi = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            // For timed mode, duration is already set in database, so we don't need to calculate it here

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
                }
            } catch (error) {
                console.error('Error stopping billing:', error);
                alert('Gagal menghentikan billing di database. Namun relay sudah dimatikan.');
            }

            // Update UI status
            setPortsData((prev) =>
                prev.map((p) => {
                    if (p.id === port.id) {
                        return {
                            ...p,
                            status: 'idle',
                            type: '',
                            nama_pelanggan: '',
                            time: 0,
                            billing: 0,
                            total: 0,
                            subtotal: 0,
                            price: '',
                            hours: '0',
                            minutes: '0',
                            promoScheme: 'tanpa-promo',
                            mode: 'timed',
                        };
                    }
                    return p;
                }),
            );
        }
    };

    const handleActionClick = (port: Port) => {
        if (port.status === 'idle') {
            setSelectedPort(port);
            setModalOpen(true);
            return;
        }

        if (port.status === 'on') {
            setSelectedPort(port);
            setModalConfirmOpen(true); // buka modal konfirmasi
            return;
        }

        if (port.status === 'pause') {
            togglePortStatus(port); // langsung resume
            return;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'on':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On</Badge>;
            case 'off':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Off</Badge>;
            case 'idle':
                return <Badge variant="secondary">Idle</Badge>;
            case 'pause':
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pause</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const filteredPorts = useMemo(() => {
        let data = portsData.filter(
            (p) =>
                p.device.toLowerCase().includes(search.toLowerCase()) ||
                p.nama_port.toLowerCase().includes(search.toLowerCase()) ||
                p.nama_pelanggan.toLowerCase().includes(search.toLowerCase()) ||
                p.status.toLowerCase().includes(search.toLowerCase()) ||
                p.type.toLowerCase().includes(search.toLowerCase()),
        );

        if (sortKey) {
            data = data.sort((a, b) => {
                let valA: string = (a as any)[sortKey];
                let valB: string = (b as any)[sortKey];
                if (sortKey === 'duration') {
                    const parse = (t: string) => t.split(':').reduce((acc, v, i) => acc + parseInt(v) * 60 ** (2 - i), 0);
                    return sortAsc ? parse(valA) - parse(valB) : parse(valB) - parse(valA);
                } else {
                    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
            });
        }
        return data;
    }, [portsData, search, sortKey, sortAsc]);

    const toggleSort = (key: 'nama_pelanggan' | 'duration') => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    useEffect(() => {
        if (selectedPort) {
            const latest = portsData.find((p) => p.id === selectedPort.id);
            if (latest) setSelectedPort(latest);
        }
    }, [portsData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <Card className="m-4">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl font-bold">Manajemen Port</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Last update: {lastUpdate.toLocaleTimeString('id-ID')}
                            {isLoading && <span className="ml-2 text-blue-600">• Loading...</span>}
                            <span className="ml-2">• Total devices: {new Set(portsData.map((p) => p.device)).size}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search device/port..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded border px-2 py-1 sm:w-64"
                        />
                        <Button variant="outline" size="sm" onClick={() => fetchPorts(true)} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Refresh'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Device</TableHead>
                                <TableHead>Port</TableHead>
                                <TableHead>Nama Port</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort('nama_pelanggan')}>
                                    Nama Pelanggan{' '}
                                    {sortKey === 'nama_pelanggan' ? (
                                        sortAsc ? (
                                            <ChevronUp className="inline h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="inline h-3 w-3" />
                                        )
                                    ) : null}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort('duration')}>
                                    Durasi{' '}
                                    {sortKey === 'duration' ? (
                                        sortAsc ? (
                                            <ChevronUp className="inline h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="inline h-3 w-3" />
                                        )
                                    ) : null}
                                </TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Device Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPorts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                                        {isLoading
                                            ? 'Loading ports...'
                                            : search
                                              ? 'Tidak ada port yang ditemukan'
                                              : 'Belum ada device/port terdaftar'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPorts.map((port) => (
                                    <TableRow key={port.id}>
                                        <TableCell className="font-medium">
                                            {port.device}
                                            {port.device_name && <div className="text-xs text-muted-foreground">{port.device_name}</div>}
                                        </TableCell>
                                        <TableCell className="font-medium">{port.no_port || '-'}</TableCell>
                                        <TableCell>{port.nama_port || '-'}</TableCell>
                                        <TableCell>{port.nama_pelanggan || '-'}</TableCell>
                                        <TableCell className="font-mono">{port.time ? timeFormat(port.time) : '-'}</TableCell>
                                        <TableCell className="font-semibold">{port.total || '-'}</TableCell>
                                        <TableCell className="w-32">{getStatusBadge(port.status)}</TableCell>
                                        <TableCell className="w-32">
                                            {port.device_status === 'online' ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Online</Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Offline</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        setSelectedPort(port);
                                                        setModalOpen(true);
                                                    }}
                                                    disabled={port.device_status === 'offline'}
                                                >
                                                    <Settings className="mr-1 h-3 w-3" /> Set/Lihat
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={port.status === 'off' || port.device_status === 'offline'}
                                                    className={cn(
                                                        port.status === 'on'
                                                            ? 'bg-yellow-400 hover:bg-yellow-500'
                                                            : port.status === 'idle'
                                                              ? 'bg-green-400 hover:bg-green-500'
                                                              : port.status === 'pause'
                                                                ? 'bg-green-400 hover:bg-green-500'
                                                                : 'cursor-not-allowed bg-gray-300',
                                                    )}
                                                    onClick={() => handleActionClick(port)}
                                                >
                                                    {port.status === 'on' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedPort && (
                <ModalSetPort
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    port={selectedPort} // langsung kirim seluruh objek Port
                    timeFormat={timeFormat} // tetap sama
                    onUpdatePort={handleUpdatePort}
                    controlRelay={controlRelay} // Pass function controlRelay
                />
            )}
            {selectedPort && (
                <Dialog open={modalConfirmOpen} onOpenChange={setModalConfirmOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-yellow-50 p-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                </div>
                                <DialogTitle className="text-lg font-semibold">Konfirmasi Aksi {selectedPort.no_port}</DialogTitle>
                            </div>
                            <DialogDescription className="mt-3 text-sm text-muted-foreground">
                                Pilih aksi yang ingin dilakukan pada {selectedPort.no_port}:
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-3">
                            <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                                <p className="text-sm font-medium text-blue-800">Pause</p>
                                <p className="mt-1 text-sm text-blue-700">Hanya menghentikan waktu billing, relay tetap ON (listrik tetap nyala).</p>
                            </div>
                            <div className="rounded-md border border-red-100 bg-red-50 p-3">
                                <p className="text-sm font-medium text-red-800">Stop & Matikan Relay</p>
                                <p className="mt-1 text-sm text-red-700">Menghentikan billing dan mematikan relay (listrik mati).</p>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <div className="flex w-full justify-end gap-2">
                                <Button variant="ghost" onClick={() => setModalConfirmOpen(false)}>
                                    Batal
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (selectedPort) {
                                            togglePortStatus(selectedPort); // Pause tanpa control relay
                                        }
                                        setModalConfirmOpen(false);
                                    }}
                                >
                                    Pause
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (selectedPort) {
                                            stopBilling(selectedPort); // Stop dan control relay OFF
                                        }
                                        setModalConfirmOpen(false);
                                    }}
                                >
                                    Stop & Matikan
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
