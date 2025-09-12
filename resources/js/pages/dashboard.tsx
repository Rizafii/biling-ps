"use client"

import { useState, useMemo, useEffect } from "react"
import { ModalSetPort } from "@/components/ModalSetPort"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { cn } from "@/lib/utils"
import { dashboard } from "@/routes"
import { type BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { Pause, Play, Settings, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { title } from "process"

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: dashboard().url },
]

interface Port {
    id: string
    no_port: string
    nama_port: string
    type: string // t = timed, b = bebas, "" = undefined
    nama_pelanggan: string
    duration: string // "HH:MM:SS"
    price: string
    status: "idle" | "on" | "pause" | "off"
    time: number // dalam menit atau detik, sesuai format timeFormat
    total: number
    billing: number // menit
    subtotal: number
    diskon: number
    promoList: { id: string; label: string }[]
    mode: "timed" | "bebas"
    hours: string
    minutes: string
    promoScheme: string
}
export default function Dashboard() {

    const dataAwal: Port[] = [
        {
            id: "1",
            no_port: "PORT 1",
            nama_port: "",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "",
            status: "idle",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
        {
            id: "2",
            no_port: "PORT 2",
            nama_port: "",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "",
            status: "idle",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
        {
            id: "3",
            no_port: "PORT 3",
            nama_port: "",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "",
            status: "idle",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
        {
            id: "5",
            no_port: "PORT 5",
            nama_port: "",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "",
            status: "idle",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
        {
            id: "6",
            no_port: "PORT 6",
            nama_port: "",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "",
            status: "idle",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
        {
            id: "7",
            no_port: "PORT 7",
            nama_port: "",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "",
            status: "idle",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
        {
            id: "8",
            no_port: "PORT 8",
            nama_port: "",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "",
            status: "off",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
    ];


    const timeFormat = (t: number) => {
        const h = Math.floor(t / 3600)
        const m = Math.floor((t % 3600) / 60)
        const s = t % 60
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }

    const [portsData, setPortsData] = useState<Port[]>(dataAwal)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalConfirmOpen, setModalConfirmOpen] = useState(true)
    const [search, setSearch] = useState("")
    const [sortKey, setSortKey] = useState<"nama_pelanggan" | "duration" | null>(null)
    const [sortAsc, setSortAsc] = useState(true)

    const [selectedPort, setSelectedPort] = useState<Port | null>(null)

    const handleUpdatePort = (updated: Port) => {
        setPortsData(prev =>
            prev.map(p => p.id === updated.id ? updated : p)
        )
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setPortsData(prev =>
                prev.map(port => {
                    if (port.status === "on") {
                        if (port.type === "t") {
                            if (port.time > 0) {
                                const newTime = port.time - 1
                                return {
                                    ...port,
                                    time: newTime,
                                    total: hitungTotal(port.price, port.billing, newTime, port.type)
                                }
                            } else {
                                return { ...port, status: "off", time: 0 }
                            }
                        } else if (port.type === "b") {
                            const newTime = port.time + 1
                            return {
                                ...port,
                                time: newTime,
                                total: hitungTotal(port.price, port.billing, newTime, port.type)
                            }
                        }
                    }

                    // Always return the port object if no changes
                    return port;
                })
            )
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    function hitungTotal(price: string, billing: number, time: number, type: string) {
        const tarif = parseInt(price.replace(/\./g, "")) || 0

        let detikDipakai = 0

        if (type === "t") {
            // Mode timed: hitung dari billing - time (sisa waktu)
            detikDipakai = billing - time
        } else if (type === "b") {
            // Mode bebas: hitung dari waktu yang sudah berjalan
            detikDipakai = time
        }

        if (detikDipakai < 0) detikDipakai = 0

        // ✅ Konversi detik ke jam untuk perhitungan
        const jam = detikDipakai / 3600 // Convert seconds to hours
        let total = Math.round(tarif * jam)

        // Pembulatan ke atas ke 100 terdekat
        const sisa = total % 100
        if (sisa !== 0) total = total + (100 - sisa)

        return total
    }

    // Toggle status port hanya untuk "on" dan "pause"
    const togglePortStatus = (port: Port) => {
        if (port.status === "idle") {
            // Jika idle, hanya buka modal
            setSelectedPort(port)
            setModalOpen(true)
            return
        }

        setPortsData(prev =>
            prev.map(p => {
                if (p.id === port.id) {
                    if (p.status === "on") {
                        setModalConfirmOpen(false)

                        return { ...p, status: "pause" }
                    }
                    if (p.status === "pause") return { ...p, status: "on" }
                }
                return p
            })
        )

        // TODO: Jika mau dihubungkan ke DB
        // Panggil API / mutation untuk update status port
        // Contoh: api.updatePortStatus(port.id, newStatus)
    }

    const handleActionClick = (port: Port) => {
        if (port.status === "idle") {
            setSelectedPort(port)
            setModalOpen(true)
            return
        }

        if (port.status === "on") {
            setSelectedPort(port)
            setModalConfirmOpen(true) // buka modal konfirmasi
            return
        }

        if (port.status === "pause") {
            togglePortStatus({ ...port, status: "on" }) // langsung play lagi
            return
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "on": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On</Badge>
            case "off": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Off</Badge>
            case "idle": return <Badge variant="secondary">Idle</Badge>
            case "pause": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pause</Badge>
            default: return <Badge variant="outline">Unknown</Badge>
        }
    }

    const filteredPorts = useMemo(() => {
        let data = portsData.filter(p =>
            p.nama_port.toLowerCase().includes(search.toLowerCase()) ||
            p.nama_pelanggan.toLowerCase().includes(search.toLowerCase()) ||
            p.status.toLowerCase().includes(search.toLowerCase()) ||
            p.type.toLowerCase().includes(search.toLowerCase())
        )

        if (sortKey) {
            data = data.sort((a, b) => {
                let valA: string = (a as any)[sortKey]
                let valB: string = (b as any)[sortKey]
                if (sortKey === "duration") {
                    const parse = (t: string) => t.split(":").reduce((acc, v, i) => acc + parseInt(v) * (60 ** (2 - i)), 0)
                    return sortAsc ? parse(valA) - parse(valB) : parse(valB) - parse(valA)
                } else {
                    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
                }
            })
        }
        return data
    }, [portsData, search, sortKey, sortAsc])

    const toggleSort = (key: "nama_pelanggan" | "duration") => {
        if (sortKey === key) setSortAsc(!sortAsc)
        else { setSortKey(key); setSortAsc(true) }
    }

    useEffect(() => {
        if (selectedPort) {
            const latest = portsData.find(p => p.id === selectedPort.id)
            if (latest) setSelectedPort(latest)
        }
    }, [portsData])


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <Card className="m-4">
                <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <CardTitle className="text-2xl font-bold">Manajemen Port</CardTitle>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search port..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border px-2 py-1 rounded w-full sm:w-64"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Port</TableHead>
                                <TableHead>Nama Port</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort("nama_pelanggan")}>
                                    Nama Pelanggan {sortKey === "nama_pelanggan" ? (sortAsc ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />) : null}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort("duration")}>
                                    Durasi {sortKey === "duration" ? (sortAsc ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />) : null}
                                </TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPorts.map((port) => (
                                <TableRow key={port.id}>
                                    <TableCell className="font-medium">{port.no_port ? port.no_port : "-"}</TableCell>
                                    <TableCell>{port.nama_port ? port.nama_port : "-"}</TableCell>
                                    <TableCell>{port.nama_pelanggan ? port.nama_pelanggan : "-"}</TableCell>
                                    <TableCell className="font-mono">{port.time ? timeFormat(port.time) : "-"}</TableCell>
                                    <TableCell className="font-semibold">{port.total ? port.total : "-"}</TableCell>
                                    <TableCell className="w-32">{getStatusBadge(port.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => { setSelectedPort(port); setModalOpen(true) }}
                                            >
                                                <Settings className="w-3 h-3 mr-1" /> Set/Lihat
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={port.status === "off"}
                                                className={cn(
                                                    port.status === "on" ? "bg-yellow-400 hover:bg-yellow-500" :
                                                        port.status === "idle" ? "bg-green-400 hover:bg-green-500" :
                                                            port.status === "pause" ? "bg-green-400 hover:bg-green-500" :
                                                                "bg-gray-300 cursor-not-allowed"
                                                )}
                                                onClick={() => handleActionClick(port)}
                                            >
                                                {port.status === "on" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedPort && (
                <ModalSetPort
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    port={selectedPort}      // langsung kirim seluruh objek Port
                    timeFormat={timeFormat}  // tetap sama
                    onUpdatePort={handleUpdatePort}
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
                                <DialogTitle className="text-lg font-semibold">
                                    Konfirmasi Pause D
                                </DialogTitle>
                            </div>
                            <DialogDescription className="mt-3 text-sm text-muted-foreground">
                                Apakah Anda yakin ingin mem-pause {selectedPort.no_port}?
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
                                <Button variant="ghost" onClick={() => setModalConfirmOpen(false)}>
                                    Batal
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (selectedPort) {
                                            setPortsData(prev =>
                                                prev.map(p =>
                                                    p.id === selectedPort.id ? { ...p, status: "pause" } : p
                                                )
                                            )
                                        }
                                        setModalConfirmOpen(false)
                                    }}
                                >
                                    Lanjutkan
                                </Button>

                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    )
}
