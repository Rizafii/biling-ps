"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Eye, Calendar, LayoutGrid, List } from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types"
import { histori } from "@/routes"

interface Billing {
    id: number
    esp_relay_id: number
    promo_id: number | null
    nama_pelanggan: string
    mode: "timer" | "bebas"
    status: "aktif" | "selesai"
    tarif_perjam: number
    total_biaya: number
    durasi_menit: number | null
    waktu_mulai: string // atau Date kalau langsung diparse
    waktu_selesai: string | null
    created_at: string
    updated_at: string
}


interface GroupedData {
    date: string
    data: Billing[]
}

export default function BillingManagement() {
    const billings: Billing[] = [
        {
            id: 1,
            esp_relay_id: 1,
            promo_id: null,
            nama_pelanggan: "Andi",
            mode: "timer",
            status: "selesai",
            tarif_perjam: 10000,
            total_biaya: 32490,
            durasi_menit: 195,
            waktu_mulai: "2025-09-10 19:11:49",
            waktu_selesai: "2025-09-10 22:25:55",
            created_at: "2025-09-10 22:25:55",
            updated_at: "2025-09-10 22:25:55",
        },
        {
            id: 2,
            esp_relay_id: 2,
            promo_id: 1,
            nama_pelanggan: "Budi",
            mode: "bebas",
            status: "aktif",
            tarif_perjam: 12000,
            total_biaya: 15000,
            durasi_menit: null,
            waktu_mulai: "2025-09-13 10:00:00",
            waktu_selesai: null,
            created_at: "2025-09-13 10:00:00",
            updated_at: "2025-09-13 10:00:00",
        },
        {
            id: 3,
            esp_relay_id: 3,
            promo_id: 2,
            nama_pelanggan: "Citra",
            mode: "timer",
            status: "selesai",
            tarif_perjam: 15000,
            total_biaya: 45000,
            durasi_menit: 180,
            waktu_mulai: "2025-09-12 14:00:00",
            waktu_selesai: "2025-09-12 17:00:00",
            created_at: "2025-09-12 17:00:00",
            updated_at: "2025-09-12 17:00:00",
        },
        {
            id: 4,
            esp_relay_id: 4,
            promo_id: null,
            nama_pelanggan: "Dedi",
            mode: "timer",
            status: "selesai",
            tarif_perjam: 15000,
            total_biaya: 30000,
            durasi_menit: 120,
            waktu_mulai: "2025-09-12 10:00:00",
            waktu_selesai: "2025-09-12 12:00:00",
            created_at: "2025-09-12 12:00:00",
            updated_at: "2025-09-12 12:00:00",
        },
        {
            id: 5,
            esp_relay_id: 5,
            promo_id: null,
            nama_pelanggan: "Eka",
            mode: "bebas",
            status: "selesai",
            tarif_perjam: 8000,
            total_biaya: 24000,
            durasi_menit: 180,
            waktu_mulai: "2025-09-11 15:30:00",
            waktu_selesai: "2025-09-11 18:30:00",
            created_at: "2025-09-11 18:30:00",
            updated_at: "2025-09-11 18:30:00",
        },
    ]
    // Tambahkan daftar promo (mock data dulu)
    const promos: Record<number, string> = {
        1: "Promo Diskon 20%",
        2: "Happy Hour",
    }

    type sortBy = "nama" | "biaya" | "mulai"
    type filter = "all" | "aktif" | "selesai" | "timer" | "bebas"
    const [search, setSearch] = useState<string>("")
    const [sortBy, setSortBy] = useState<sortBy>("nama")
    const [filter, setFilter] = useState<filter>("all")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [openDetail, setOpenDetail] = useState<boolean>(false)
    const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null)
    const [viewMode, setViewMode] = useState<"daily" | "table">("daily")

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Histori", href: histori().url },
    ]

    // Filtering + Sorting + Date Range
    const filteredBillings = useMemo<Billing[]>(() => {
        let data = billings.filter((b) => b.nama_pelanggan.toLowerCase().includes(search.toLowerCase()))

        // Filter by status
        if (filter !== "all") {
            if (filter === "aktif" || filter === "selesai") {
                data = data.filter((b) => b.status === filter)
            } else if (filter === "timer" || filter === "bebas") {
                data = data.filter((b) => b.mode === filter)
            }
        }

        // Filter by date range
        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            data = data.filter((b) => {
                const createdDate = new Date(b.created_at)
                return createdDate >= start && createdDate <= end
            })
        }

        // Sort data
        switch (sortBy) {
            case "nama":
                return [...data].sort((a, b) => a.nama_pelanggan.localeCompare(b.nama_pelanggan))
            case "biaya":
                return [...data].sort((a, b) => b.total_biaya - a.total_biaya)
            case "mulai":
                return [...data].sort((a, b) => new Date(b.waktu_mulai).getTime() - new Date(a.waktu_mulai).getTime())
            default:
                return data
        }
    }, [search, filter, sortBy, startDate, endDate, billings])

    // Group data by date
    const groupedByDate = useMemo<GroupedData[]>(() => {
        const groups: Record<string, Billing[]> = {}

        filteredBillings.forEach((billing: Billing) => {
            const dateKey = new Date(billing.created_at).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })

            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(billing)
        })

        // Sort dates in descending order
        const sortedGroups: GroupedData[] = []
        Object.keys(groups)
            .sort((a: string, b: string) => {
                const dateA = new Date(groups[a][0].created_at)
                const dateB = new Date(groups[b][0].created_at)
                return dateB.getTime() - dateA.getTime()
            })
            .forEach((date: string) => {
                sortedGroups.push({ date, data: groups[date] })
            })

        return sortedGroups
    }, [filteredBillings])

    // Calculate daily totals
    const getDailyTotal = (data: Billing[]): number => {
        return data.reduce((total: number, billing: Billing) => total + billing.total_biaya, 0)
    }

    const clearDateFilter = (): void => {
        setStartDate("")
        setEndDate("")
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Card className="m-4">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-2xl font-bold">Manajemen Histori Billing</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            placeholder="Cari nama pelanggan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-48"
                        />
                        <Select value={filter} onValueChange={(val) => setFilter(val as filter)}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="aktif">Aktif</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
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
                        <div className="flex border rounded-md">
                            <Button
                                variant={viewMode === "daily" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("daily")}
                                className="rounded-r-none"
                            >
                                <LayoutGrid className="w-4 h-4 mr-1" />
                                Harian
                            </Button>
                            <Button
                                variant={viewMode === "table" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("table")}
                                className="rounded-l-none"
                            >
                                <List className="w-4 h-4 mr-1" />
                                Tabel
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-4 border-b justify-end">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Filter Tanggal:</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
                            <span className="text-sm text-gray-500">sampai</span>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
                            {(startDate || endDate) && (
                                <Button variant="outline" size="sm" onClick={clearDateFilter} className="text-xs bg-transparent">
                                    Hapus Filter
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>

                {viewMode === "table" ? (
                    // Full table view like promo page
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Durasi</TableHead>
                                    <TableHead>Tarif/Jam</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBillings.map((billing) => (
                                    <TableRow key={billing.id}>
                                        <TableCell className="font-medium">{billing.nama_pelanggan}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    billing.mode === "timer" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                                                }
                                            >
                                                {billing.mode}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {billing.status === "selesai" ? (
                                                <Badge className="bg-green-100 text-green-800">Selesai</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800">Aktif</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{billing.durasi_menit ? `${billing.durasi_menit} menit` : "-"}</TableCell>
                                        <TableCell>Rp {Number(billing.tarif_perjam).toLocaleString()}</TableCell>
                                        <TableCell className="font-semibold">Rp {Number(billing.total_biaya).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(billing.created_at).toLocaleDateString("id-ID")}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedBilling(billing)
                                                    setOpenDetail(true)
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                ) : (
                    // Daily grouped view
                    <div className="m-4">
                        {groupedByDate.length > 0 ? (
                            <div className="space-y-6">
                                {groupedByDate.map(({ date, data }) => (
                                    <Card key={date} className="overflow-hidden shadow-lg">
                                        <CardHeader className="bg-gradient-to-r border-b px-6 py-4">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="flex items-center gap-2 text-white text-lg"><Calendar /> {date}</CardTitle>
                                                <div className="flex gap-3 text-sm">
                                                    <Badge variant="outline">
                                                        {data.length} transaksi
                                                    </Badge>
                                                    <Badge className="bg-green-100 text-green-800">
                                                        Total: Rp {getDailyTotal(data).toLocaleString()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Pelanggan</TableHead>
                                                        <TableHead>Mode</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Durasi</TableHead>
                                                        <TableHead>Total</TableHead>
                                                        <TableHead>Waktu Mulai</TableHead>
                                                        <TableHead>Waktu Selesai</TableHead>
                                                        <TableHead>Aksi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {data.map((billing: Billing) => (
                                                        <TableRow key={billing.id}>
                                                            <TableCell className="font-medium">{billing.nama_pelanggan}</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={
                                                                        billing.mode === "timer"
                                                                            ? "bg-blue-100 text-blue-800"
                                                                            : "bg-purple-100 text-purple-800"
                                                                    }
                                                                >
                                                                    {billing.mode}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {billing.status === "selesai" ? (
                                                                    <Badge className="bg-green-100 text-green-800">Selesai</Badge>
                                                                ) : (
                                                                    <Badge className="bg-yellow-100 text-yellow-800">Aktif</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{billing.durasi_menit ? `${billing.durasi_menit} menit` : "-"}</TableCell>
                                                            <TableCell className="font-semibold">
                                                                Rp {Number(billing.total_biaya).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell>
                                                                {new Date(billing.waktu_mulai).toLocaleTimeString("id-ID", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </TableCell>
                                                            <TableCell>
                                                                {billing.waktu_selesai
                                                                    ? new Date(billing.waktu_selesai).toLocaleTimeString("id-ID", {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedBilling(billing)
                                                                        setOpenDetail(true)
                                                                    }}
                                                                    className="hover:bg-blue-50"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
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
                            <Card className="p-8 text-center">
                                <div className="text-gray-500">
                                    <div className="text-6xl mb-4">📊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data ditemukan</h3>
                                    <p>Tidak ada data billing yang sesuai dengan kriteria pencarian Anda</p>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* Modal Detail */}
                <Dialog open={openDetail} onOpenChange={setOpenDetail}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Detail Billing</DialogTitle>
                        </DialogHeader>
                        {selectedBilling && (
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Pelanggan</span>
                                    <span>{selectedBilling.nama_pelanggan}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Mode</span>
                                    <span className="capitalize ">{selectedBilling.mode}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Status</span>
                                    <span className={selectedBilling.status === "aktif" ? "text-green-600 font-semibold" : ""}>
                                        {selectedBilling.status}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Promo</span>
                                    <span>
                                        {selectedBilling.promo_id
                                            ? promos[selectedBilling.promo_id] ?? `Promo #${selectedBilling.promo_id}`
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Tarif Per Jam</span>
                                    <span>Rp {Number(selectedBilling.tarif_perjam).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Durasi</span>
                                    <span>{selectedBilling.durasi_menit ?? "-"} menit</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Total Biaya</span>
                                    <span className="font-bold text-blue-600">
                                        Rp {Number(selectedBilling.total_biaya).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Waktu Mulai</span>
                                    <span>{selectedBilling.waktu_mulai}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-medium ">Waktu Selesai</span>
                                    <span>{selectedBilling.waktu_selesai ?? "-"}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="font-medium ">Dibuat</span>
                                    <span>{new Date(selectedBilling.created_at).toLocaleString("id-ID")}</span>
                                </div>
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
        </AppLayout>
    )
}
