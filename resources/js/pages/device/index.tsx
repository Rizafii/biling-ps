'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as deviceIndex } from '@/routes/device';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Eye, Plus, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Device', href: deviceIndex().url }];

interface EspDevice {
    id: number;
    device_id: string;
    name: string | null;
    status: 'online' | 'offline';
    last_heartbeat: string | null;
}

interface Props {
    devices: EspDevice[];
}

export default function Index({ devices: initialDevices }: Props) {
    const { data, setData, post, processing, reset, errors, put } = useForm({
        device_id: '',
        name: '',
        status: 'offline' as 'online' | 'offline',
    });

    const [devices, setDevices] = useState<EspDevice[]>(initialDevices);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'status'>('name');
    const [openAdd, setOpenAdd] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<EspDevice | null>(null);
    const [openEdit, setOpenEdit] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Fungsi untuk fetch devices dengan useCallback untuk mencegah re-render berlebihan
    const fetchDevices = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) {
                setIsRefreshing(true);
            }

            // Gunakan Inertia router untuk konsistensi dengan framework
            const response = await fetch('/api/devices', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    // Tambahkan CSRF token jika diperlukan
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin', // Pastikan cookies session ikut terkirim
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && Array.isArray(result.devices)) {
                setDevices(result.devices);
                setLastUpdate(new Date());
            } else {
                console.warn('Invalid response format:', result);
                // Fallback: reload halaman jika API tidak sesuai format
                router.reload({ only: ['devices'] });
            }
        } catch (error) {
            console.error('Error fetching devices:', error);

            // Fallback: gunakan Inertia untuk reload data
            router.reload({
                only: ['devices'],
                onSuccess: (page) => {
                    if (page.props.devices) {
                        setDevices(page.props.devices as EspDevice[]);
                        setLastUpdate(new Date());
                    }
                },
            });
        } finally {
            if (showLoading) {
                setIsRefreshing(false);
            }
        }
    }, []);

    // Auto-refresh devices setiap 5 detik
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Set interval hanya jika komponen masih mounted
        interval = setInterval(() => {
            fetchDevices(false); // Auto refresh tanpa loading indicator
        }, 5000);

        // Cleanup interval saat unmount
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [fetchDevices]);

    // Manual refresh dengan loading indicator
    const handleManualRefresh = useCallback(async () => {
        await fetchDevices(true);
    }, [fetchDevices]);

    // Update initial devices ketika props berubah
    useEffect(() => {
        setDevices(initialDevices);
        setLastUpdate(new Date());
    }, [initialDevices]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/device', {
            onSuccess: () => {
                reset();
                setOpenAdd(false);
                // Refresh setelah berhasil menambah
                setTimeout(() => handleManualRefresh(), 500);
            },
            onError: (errors) => {
                console.error('Error adding device:', errors);
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDevice) return;

        put(`/device/${selectedDevice.id}`, {
            onSuccess: () => {
                reset();
                setOpenEdit(false);
                setSelectedDevice(null);
                // Refresh setelah berhasil update
                setTimeout(() => handleManualRefresh(), 500);
            },
            onError: (errors) => {
                console.error('Error updating device:', errors);
            },
        });
    };

    const filteredDevices = useMemo(() => {
        const filtered = devices.filter(
            (d) => d.device_id.toLowerCase().includes(search.toLowerCase()) || (d.name ?? '').toLowerCase().includes(search.toLowerCase()),
        );

        switch (sortBy) {
            case 'name':
                return [...filtered].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
            case 'status':
                return [...filtered].sort((a, b) => a.status.localeCompare(b.status));
            default:
                return filtered;
        }
    }, [devices, search, sortBy]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Device" />
            <Card className="m-4">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl font-bold">Manajemen Device ESP</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Last update: {lastUpdate.toLocaleTimeString('id-ID')}
                            {isRefreshing && <span className="ml-2 text-blue-600">• Refreshing...</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input placeholder="Cari device..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
                        <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'name' | 'status')}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nama</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing}>
                            <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Button onClick={() => setOpenAdd(true)}>
                            <Plus className="mr-1 h-4 w-4" /> Tambah
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Device ID</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Status Koneksi</TableHead>
                                <TableHead>Last Heartbeat</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDevices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                                        {search ? 'Tidak ada device yang ditemukan' : 'Belum ada device terdaftar'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDevices.map((device) => (
                                    <TableRow key={device.id}>
                                        <TableCell className="font-medium">{device.device_id}</TableCell>
                                        <TableCell>{device.name ?? '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {device.status === 'online' ? (
                                                    <>
                                                        <Wifi className="h-4 w-4 text-green-600" />
                                                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                                                    </>
                                                ) : (
                                                    <>
                                                        <WifiOff className="h-4 w-4 text-red-600" />
                                                        <Badge className="bg-red-100 text-red-800">Offline</Badge>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{device.last_heartbeat ? new Date(device.last_heartbeat).toLocaleString('id-ID') : '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedDevice(device);
                                                        setOpenDetail(true);
                                                    }}
                                                    title="Lihat detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setData('device_id', device.device_id);
                                                        setData('name', device.name ?? '');
                                                        setData('status', device.status);
                                                        setSelectedDevice(device);
                                                        setOpenEdit(true);
                                                    }}
                                                    title="Edit device"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" title="Hapus device">
                                                    <Trash2 className="h-4 w-4" />
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

            {/* Modal Tambah Device */}
            <Dialog
                open={openAdd}
                onOpenChange={(open) => {
                    setOpenAdd(open);
                    if (!open) {
                        reset();
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Device ESP</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div>
                                <Label>Device ID</Label>
                                <Input
                                    value={data.device_id}
                                    onChange={(e) => setData('device_id', e.target.value)}
                                    placeholder="Contoh: ESP001"
                                    required
                                />
                                {errors.device_id && <p className="text-sm text-red-500">{errors.device_id}</p>}
                            </div>

                            <div>
                                <Label>Nama Device</Label>
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Contoh: ESP Device Ruang 1" />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div>
                                <Label>Status Koneksi</Label>
                                <Select value={data.status} onValueChange={(val) => setData('status', val as 'online' | 'offline')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="offline">Offline</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setOpenAdd(false);
                                    reset();
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Device */}
            <Dialog
                open={openEdit}
                onOpenChange={(open) => {
                    setOpenEdit(open);
                    if (!open) {
                        reset();
                        setSelectedDevice(null);
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Device ESP</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="space-y-3">
                            <div>
                                <Label>Device ID</Label>
                                <Input value={data.device_id} onChange={(e) => setData('device_id', e.target.value)} required />
                                {errors.device_id && <p className="text-sm text-red-500">{errors.device_id}</p>}
                            </div>

                            <div>
                                <Label>Nama Device</Label>
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div>
                                <Label>Status Koneksi</Label>
                                <Select value={data.status} onValueChange={(val) => setData('status', val as 'online' | 'offline')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="offline">Offline</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setOpenEdit(false);
                                    reset();
                                    setSelectedDevice(null);
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Detail Device */}
            <Dialog
                open={openDetail}
                onOpenChange={(open) => {
                    setOpenDetail(open);
                    if (!open) {
                        setSelectedDevice(null);
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Device ESP</DialogTitle>
                    </DialogHeader>
                    {selectedDevice && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Device ID</span>
                                <span>{selectedDevice.device_id}</span>
                            </div>

                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Nama</span>
                                <span>{selectedDevice.name ?? "-"}</span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Status</span>
                                <div className="flex items-center gap-2">
                                    {selectedDevice.status === "online" ? (
                                        <>
                                            <Wifi className="h-4 w-4 text-green-600" />
                                            <Badge className="bg-green-100 text-green-800">Online</Badge>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff className="h-4 w-4 text-red-600" />
                                            <Badge className="bg-red-100 text-red-800">Offline</Badge>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between py-2">
                                <span className="font-medium">Last Heartbeat</span>
                                <span className="text-right">
                                    {selectedDevice.last_heartbeat
                                        ? new Date(selectedDevice.last_heartbeat).toLocaleString("id-ID")
                                        : "-"}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenDetail(false);
                                setSelectedDevice(null);
                            }}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}
