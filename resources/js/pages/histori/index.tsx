'use client';

import ModalPembayaran from '@/components/ModalPembayaran';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Calendar, CreditCard, Eye, LayoutGrid, List } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface EspRelay {
    id: number;
    nama_relay: string;
    created_at: string;
    updated_at: string;
}

interface User {
    id: number;
    name: string;
}

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

interface Billing {
    id: number;
    esp_relay_id: number;
    user_id: number;
    promo_id: number | null;
    nama_pelanggan: string;
    mode: 'bebas' | 'timer';
    status: 'aktif' | 'selesai' | 'sudah_bayar';
    tarif_perjam: number;
    total_biaya: number;
    total_setelah_promo?: number | null;
    durasi: number | string | null; // ✅ sesuai schema
    waktu_mulai: string;
    waktu_selesai: string | null;
    created_at: string;
    updated_at: string;
    promo?: Promo | null;
    esp_relay?: EspRelay | null;
    // user: User | null;
}

interface GroupedData {
    esp_relay?: EspRelay;
    promo?: Promo | null;
    date: string;
    data: Billing[];
}

interface IndexProps {
    data: Billing[];
    promo: Promo[];
    esp_relay: EspRelay[];
}

export default function Index({ data, promo, esp_relay }: IndexProps) {
    const { props } = usePage<any>();
    const auth = props.auth;
    const [showAlert, setShowAlert] = useState(false);

    // Show flash messages
    useEffect(() => {
        if (props.flash?.success || props.flash?.error) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [props.flash]);

    type sortBy = 'nama' | 'biaya' | 'mulai';
    type filter = 'all' | 'aktif' | 'selesai' | 'sudah_bayar' | 'timer' | 'bebas';
    const [search, setSearch] = useState<string>('');
    const billings = data ?? [];
    const [sortBy, setSortBy] = useState<sortBy>('nama');
    const [filter, setFilter] = useState<filter>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [openDetail, setOpenDetail] = useState<boolean>(false);
    const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
    const [openPembayaran, setOpenPembayaran] = useState<boolean>(false);
    const [selectedBillingForPayment, setSelectedBillingForPayment] = useState<Billing | null>(null);
    const [viewMode, setViewMode] = useState<'daily' | 'table'>('daily');
    const [quickRange, setQuickRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Histori', href: dashboard().url }];

    const toDateInputValue = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const applyQuickRange = (range: 'today' | 'week' | 'month') => {
        // gunakan format YYYY-MM-DD lokal

        const now = new Date();
        let start: Date;
        let end: Date;

        if (range === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end.setHours(23, 59, 59, 999);
        } else if (range === 'week') {
            const day = now.getDay() === 0 ? 7 : now.getDay();
            start = new Date(now);
            start.setDate(now.getDate() - (day - 1));
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // akhir bulan
            end.setHours(23, 59, 59, 999);
        }

        setStartDate(toDateInputValue(start));
        setEndDate(toDateInputValue(end));

        setQuickRange(range);
    };

    // Filtering + Sorting + Date Range
    const filteredBillings = useMemo<Billing[]>(() => {
        let data = billings.filter((b) => b.nama_pelanggan.toLowerCase().includes(search.toLowerCase()));

        // Filter by status
        if (filter !== 'all') {
            if (filter === 'aktif' || filter === 'selesai' || filter === 'sudah_bayar') {
                data = data.filter((b) => b.status === filter);
            } else if (filter === 'timer' || filter === 'bebas') {
                data = data.filter((b) => b.mode === filter);
            }
        }

        // Filter by date range
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            data = data.filter((b) => {
                const createdDate = new Date(b.created_at);
                return createdDate >= start && createdDate <= end;
            });
        }

        // Sort data
        switch (sortBy) {
            case 'nama':
                return [...data].sort((a, b) => a.nama_pelanggan.localeCompare(b.nama_pelanggan));
            case 'biaya':
                return [...data].sort((a, b) => b.total_biaya - a.total_biaya);
            case 'mulai':
                return [...data].sort((a, b) => new Date(b.waktu_mulai).getTime() - new Date(a.waktu_mulai).getTime());
            default:
                return data;
        }
    }, [search, filter, sortBy, startDate, endDate, billings]);

    // Group data by date
    const groupedByDate = useMemo<GroupedData[]>(() => {
        const groups: Record<string, Billing[]> = {};

        filteredBillings.forEach((billing: Billing) => {
            const dateKey = new Date(billing.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(billing);
        });

        // Sort dates in descending order
        const sortedGroups: GroupedData[] = [];
        Object.keys(groups)
            .sort((a: string, b: string) => {
                const dateA = new Date(groups[a][0].created_at);
                const dateB = new Date(groups[b][0].created_at);
                return dateB.getTime() - dateA.getTime();
            })
            .forEach((date: string) => {
                sortedGroups.push({ date, data: groups[date] });
            });

        return sortedGroups;
    }, [filteredBillings]);

    // Calculate daily totals
    // parsing number yang toleran terhadap string berformat (Rp, koma, dsb.)
    const parseNumber = (v: any): number => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        const cleaned = String(v).replace(/[^0-9.-]+/g, ''); // buang semua kecuali digit, titik, minus
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : 0;
    };

    // support kedua nama field durasi (durasi_menit atau durasi)
    const getDurasiMenit = (b: Billing): number => {
        // @ts-ignore — kompatibilitas sementara jika belum diganti interface
        return (typeof (b as any).durasi_menit === 'number' ? (b as any).durasi_menit : (b as any).durasi) ?? 0;
    };

    // fallback kalkulasi total dari tarif & durasi (jika backend tidak memberikan atau string rusak)
    const computeTotalFromRate = (b: Billing): number => {
        const tarif = parseNumber((b as any).tarif_perjam);
        const durasiMenit = getDurasiMenit(b);
        return Math.round((durasiMenit / 60) * tarif); // pembulatan; sesuaikan jika mau floor/toFixed
    };

    const getDailyTotal = (data: Billing[]): number => {
        return data.reduce((acc: number, b: Billing) => {
            const tb = parseNumber((b as any).total_biaya);
            // jika total_biaya tidak valid (NaN/0) coba hitung dari tarif+durasi
            const val = Number.isFinite(tb) && tb !== 0 ? tb : computeTotalFromRate(b);
            return acc + val;
        }, 0);
    };

    // Fungsi untuk menghitung transaksi yang sudah selesai (sudah dibayar)
    const getCompletedTransactions = (data: Billing[]): number => {
        return data.filter((b) => b.status === 'sudah_bayar').length;
    };

    // Fungsi untuk menghitung total dari harga setelah promo untuk transaksi yang sudah dibayar
    const getDailyTotalPaid = (data: Billing[]): number => {
        return data
            .filter((b) => b.status === 'sudah_bayar')
            .reduce((acc: number, b: Billing) => {
                // Gunakan total_setelah_promo jika ada, jika tidak gunakan total_biaya
                const amount =
                    b.total_setelah_promo !== null && b.total_setelah_promo !== undefined
                        ? parseNumber(b.total_setelah_promo)
                        : parseNumber(b.total_biaya);
                return acc + amount;
            }, 0);
    };

    const clearDateFilter = (): void => {
        setStartDate('');
        setEndDate('');
    };

    const handleOpenPembayaran = (billing: Billing) => {
        setSelectedBillingForPayment(billing);
        setOpenPembayaran(true);
    };

    const handleClosePembayaran = () => {
        setOpenPembayaran(false);
        setSelectedBillingForPayment(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getDisplayAmount = (billing: Billing) => {
        // Show total_setelah_promo if billing is paid and has promo, otherwise show total_biaya
        if (billing.status === 'sudah_bayar' && billing.total_setelah_promo !== null && billing.total_setelah_promo !== undefined) {
            return billing.total_setelah_promo;
        }
        return billing.total_biaya;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Histori"></Head>

            {/* Flash Messages */}
            {showAlert && (props.flash?.success || props.flash?.error) && (
                <div className="m-4">
                    <Alert className={props.flash?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <AlertDescription className={props.flash?.success ? 'text-green-800' : 'text-red-800'}>
                            {props.flash?.success || props.flash?.error}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <Card className="m-4">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-2xl font-bold">Manajemen Histori Billing</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input placeholder="Cari nama pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
                        <Select value={filter} onValueChange={(val) => setFilter(val as filter)}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="aktif">Aktif</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                                <SelectItem value="sudah_bayar">Sudah Bayar</SelectItem>
                                <SelectItem value="timer">Timer</SelectItem>
                                <SelectItem value="bebas">Bebas</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={(val) => setSortBy(val as sortBy)}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nama">Nama</SelectItem>
                                <SelectItem value="biaya">Total Biaya</SelectItem>
                                <SelectItem value="mulai">Waktu Mulai</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex rounded-md border">
                            <Button
                                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('daily')}
                                className="rounded-r-none"
                            >
                                <LayoutGrid className="mr-1 h-4 w-4" />
                                Harian
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                                className="rounded-l-none"
                            >
                                <List className="mr-1 h-4 w-4" />
                                Tabel
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex justify-end space-x-1 pt-0">
                    <Select value={quickRange} onValueChange={(val) => applyQuickRange(val as 'today' | 'week' | 'month')}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Pilih Rentang Waktu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="today">Hari Ini</SelectItem>
                            <SelectItem value="week">Minggu Ini</SelectItem>
                            <SelectItem value="month">Bulan Ini</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex flex-col justify-end gap-2 pb-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">Filter Tanggal:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
                            <span className="text-sm text-gray-500">sampai</span>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
                            {(startDate || endDate) && (
                                <Button variant="outline" size="sm" onClick={clearDateFilter} className="bg-transparent text-xs">
                                    Hapus Filter
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>

                {viewMode === 'table' ? (
                    // Full table view like promo page
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Relay</TableHead>
                                    <TableHead>Promo</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Durasi</TableHead>
                                    <TableHead>Tarif/Jam</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            {groupedByDate.length > 0 ? (
                                <TableBody>
                                    {filteredBillings.map((billing) => (
                                        <TableRow key={billing.id}>
                                            <TableCell className="font-medium">{billing.id}</TableCell>
                                            <TableCell className="font-medium">{billing.nama_pelanggan}</TableCell>
                                            <TableCell>{billing.esp_relay?.nama_relay ?? '-'}</TableCell>
                                            <TableCell>{billing.promo?.name ?? '-'}</TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        billing.mode === 'timer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                    }
                                                >
                                                    {billing.mode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {billing.status === 'selesai' ? (
                                                    <Badge className="bg-green-100 text-green-800">Selesai</Badge>
                                                ) : billing.status === 'sudah_bayar' ? (
                                                    <Badge className="bg-blue-100 text-blue-800">Sudah Bayar</Badge>
                                                ) : (
                                                    <Badge className="bg-yellow-100 text-yellow-800">Aktif</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{billing.durasi ? billing.durasi : '-'}</TableCell>
                                            <TableCell>Rp {Number(billing.tarif_perjam).toLocaleString()}</TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(getDisplayAmount(billing))}
                                                {billing.status === 'sudah_bayar' && billing.promo && (
                                                    <div className="text-xs text-green-600">Dengan promo: {billing.promo.name}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>{new Date(billing.created_at).toLocaleDateString('id-ID')}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedBilling(billing);
                                                            setOpenDetail(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {billing.status === 'selesai' && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleOpenPembayaran(billing)}
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                                        {search ? 'Tidak ada histori biling yang ditemukan' : 'Belum ada data histori biling'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </Table>
                    </CardContent>
                ) : (
                    // Daily grouped view
                    <div className="m-4">
                        {groupedByDate.length > 0 ? (
                            <div className="space-y-6">
                                {groupedByDate.map(({ date, data }) => (
                                    <Card key={date} className="overflow-hidden p-4 shadow-lg">
                                        <CardHeader className="border-b bg-gradient-to-r px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Calendar /> {date}
                                                </CardTitle>
                                                <div className="flex gap-3 text-sm">
                                                    <Badge variant="outline">{getCompletedTransactions(data)} transaksi selesai</Badge>
                                                    <Badge className="bg-green-100 text-green-800">
                                                        Total: Rp {getDailyTotalPaid(data).toLocaleString()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>No</TableHead>
                                                        <TableHead>Pelanggan</TableHead>
                                                        <TableHead>Relay</TableHead>
                                                        <TableHead>Promo</TableHead>
                                                        <TableHead>Mode</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Durasi</TableHead>
                                                        {auth.user.role.name === 'karyawan' ? null :
                                                            <TableHead>Total</TableHead>
                                                        }
                                                        <TableHead>Waktu Mulai</TableHead>
                                                        <TableHead>Waktu Selesai</TableHead>
                                                        <TableHead>Aksi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {data.map((billing: Billing, index: number) => (
                                                        <TableRow key={billing.id}>
                                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                                            <TableCell className="font-medium">{billing.nama_pelanggan}</TableCell>
                                                            <TableCell>{billing.esp_relay?.nama_relay ?? '-'}</TableCell>
                                                            <TableCell>{billing.promo?.name ?? '-'}</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={
                                                                        billing.mode === 'timer'
                                                                            ? 'bg-blue-100 text-blue-800'
                                                                            : 'bg-purple-100 text-purple-800'
                                                                    }
                                                                >
                                                                    {billing.mode}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {billing.status === 'selesai' ? (
                                                                    <Badge className="bg-green-100 text-green-800">Selesai</Badge>
                                                                ) : billing.status === 'sudah_bayar' ? (
                                                                    <Badge className="bg-blue-100 text-blue-800">Sudah Bayar</Badge>
                                                                ) : (
                                                                    <Badge className="bg-yellow-100 text-yellow-800">Aktif</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{billing.durasi ? billing.durasi : '-'}</TableCell>
                                                            {auth.user.role.name !== 'karyawan' && (
                                                                <TableCell className="font-semibold">
                                                                    {formatCurrency(getDisplayAmount(billing))}
                                                                    {billing.status === 'sudah_bayar' && billing.promo && (
                                                                        <div className="text-xs text-green-600">
                                                                            Dengan promo: {billing.promo.name}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                            )}
                                                            <TableCell>
                                                                {new Date(billing.waktu_mulai).toLocaleTimeString('id-ID', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </TableCell>
                                                            <TableCell>
                                                                {billing.waktu_selesai
                                                                    ? new Date(billing.waktu_selesai).toLocaleTimeString('id-ID', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })
                                                                    : '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setSelectedBilling(billing);
                                                                            setOpenDetail(true);
                                                                        }}
                                                                        className="hover:bg-blue-50"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    {billing.status === 'selesai' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="default"
                                                                            className="bg-green-600 hover:bg-green-700"
                                                                            onClick={() => handleOpenPembayaran(billing)}
                                                                        >
                                                                            <CreditCard className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="border-y-2 py-6 text-center text-muted-foreground">
                                {search ? 'Tidak ada histori billing yang ditemukan' : 'Belum ada histori billing terdaftar'}
                            </div>
                        )}
                    </div>
                )}

                {/* Modal Detail */}
                <Dialog open={openDetail} onOpenChange={setOpenDetail}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Detail Billing</DialogTitle>
                            <DialogDescription>Informasi lengkap tentang billing yang dipilih</DialogDescription>
                        </DialogHeader>
                        {selectedBilling && (
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Pelanggan</span>
                                    <span>{selectedBilling.nama_pelanggan}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Mode</span>
                                    <span className="capitalize">{selectedBilling.mode}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Status</span>
                                    <span className={selectedBilling.status === 'aktif' ? 'font-semibold text-green-600' : ''}>
                                        {selectedBilling.status}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Promo</span>
                                    <span>{selectedBilling.promo?.name ?? '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Relay</span>
                                    <span>{selectedBilling.esp_relay?.nama_relay ?? '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Tarif Per Jam</span>
                                    <span>Rp {Number(selectedBilling.tarif_perjam).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Durasi</span>
                                    <span>{selectedBilling.durasi ? selectedBilling.durasi : '-'}</span>
                                </div>
                                {auth.user.role.name === "karyawan" ? null :
                                    <div className="flex justify-between border-b border-gray-100 py-2">
                                        <span className="font-medium">Total Biaya</span>
                                        <span className="font-bold text-blue-600">Rp {Number(selectedBilling.total_biaya).toLocaleString()}</span>
                                    </div>}
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Waktu Mulai</span>
                                    <span>{new Date(selectedBilling.waktu_mulai).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 py-2">
                                    <span className="font-medium">Waktu Selesai</span>
                                    <span>
                                        {selectedBilling.waktu_selesai
                                            ? new Date(selectedBilling.waktu_selesai).toLocaleString('id-ID')
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="font-medium">Dibuat</span>
                                    <span>{new Date(selectedBilling.created_at).toLocaleString('id-ID')}</span>
                                </div>
                                {/* <div className="flex justify-between py-2">
                                    <span className="font-medium">Dibuat Oleh</span>
                                    <span>{selectedBilling.user?.name ?? '-'}</span>
                                </div> */}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenDetail(false)}>
                                Tutup
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>

            {/* Modal Pembayaran */}
            <ModalPembayaran isOpen={openPembayaran} onClose={handleClosePembayaran} billing={selectedBillingForPayment} promos={promo} />
        </AppLayout>
    );
}
