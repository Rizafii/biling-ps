"use client"

import { useState, useMemo } from "react"
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
import { Pause, Play, Settings, ChevronUp, ChevronDown } from "lucide-react"

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
    status: "idle" | "on" | "paus" | "off"
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

    const ports: Port[] = [
        {
            id: "1",
            no_port: "PORT 1",
            nama_port: "PS 1",
            type: "t",
            nama_pelanggan: "Web Server",
            duration: "02:15:30",
            price: "25.000",
            status: "on",
            time: 135, // menit
            total: 25000,
            billing: 135,
            subtotal: 25000,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }, { id: "promo-1", label: "Promo 1" }],
            mode: "timed",
            hours: "2",
            minutes: "15",
            promoScheme: "promo-1",
        },
        {
            id: "2",
            no_port: "PORT 2",
            nama_port: "PS 2",
            type: "b",
            nama_pelanggan: "Database Server",
            duration: "01:45:22",
            price: "20.000",
            status: "on",
            time: 105,
            total: 20000,
            billing: 105,
            subtotal: 20000,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }, { id: "promo-1", label: "Promo 1" }],
            mode: "bebas",
            hours: "1",
            minutes: "45",
            promoScheme: "tanpa-promo",
        },
        {
            id: "3",
            no_port: "PORT 3",
            nama_port: "PS 3",
            type: "",
            nama_pelanggan: "API Gateway",
            duration: "00:30:15",
            price: "15.000",
            status: "off",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }],
            mode: "timed",
            hours: "0",
            minutes: "30",
            promoScheme: "tanpa-promo",
        },
        {
            id: "5",
            no_port: "PORT 5",
            nama_port: "PS 5",
            type: "",
            nama_pelanggan: "",
            duration: "00:00:00",
            price: "00.000",
            status: "idle",
            time: 0,
            total: 0,
            billing: 0,
            subtotal: 0,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }, { id: "promo-1", label: "Promo 1" }],
            mode: "timed",
            hours: "0",
            minutes: "0",
            promoScheme: "tanpa-promo",
        },
        {
            id: "6",
            no_port: "PORT 6",
            nama_port: "PS 6",
            type: "t",
            nama_pelanggan: "Cache Server",
            duration: "00:00:00",
            price: "0",
            status: "paus",
            time: 72,
            total: 18000,
            billing: 72,
            subtotal: 18000,
            diskon: 0,
            promoList: [{ id: "tanpa-promo", label: "Tanpa Promo" }, { id: "promo-1", label: "Promo 1" }],
            mode: "timed",
            hours: "1",
            minutes: "12",
            promoScheme: "tanpa-promo",
        },
        {
            id: "7",
            no_port: "PORT 7",
            nama_port: "PS 7",
            type: "",
            nama_pelanggan: "Load Balancer",
            duration: "00:00:00",
            price: "0",
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
    ]



    const timeFormat = (t: number) => {
        const h = Math.floor(t / 3600)
        const m = Math.floor((t % 3600) / 60)
        const s = t % 60
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }

    const [portsData, setPortsData] = useState<Port[]>(ports)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedPort, setSelectedPort] = useState<Port | null>(null)
    const [search, setSearch] = useState("")
    const [sortKey, setSortKey] = useState<"nama_pelanggan" | "duration" | null>(null)
    const [sortAsc, setSortAsc] = useState(true)

    // Toggle status port hanya untuk "on" dan "paus"
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
                    if (p.status === "on") return { ...p, status: "paus" }
                    if (p.status === "paus") return { ...p, status: "on" }
                }
                return p
            })
        )

        // TODO: Jika mau dihubungkan ke DB
        // Panggil API / mutation untuk update status port
        // Contoh: api.updatePortStatus(port.id, newStatus)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "on": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On</Badge>
            case "off": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Off</Badge>
            case "idle": return <Badge variant="secondary">Idle</Badge>
            case "paus": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Paus</Badge>
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
                                    <TableCell className="font-medium">{port.no_port}</TableCell>
                                    <TableCell>{port.nama_port}</TableCell>
                                    <TableCell>{port.nama_pelanggan}</TableCell>
                                    <TableCell className="font-mono">{timeFormat(port.time)}</TableCell>
                                    <TableCell className="font-semibold">{port.price}</TableCell>
                                    <TableCell>{getStatusBadge(port.status)}</TableCell>
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
                                                            port.status === "paus" ? "bg-gray-400 hover:bg-gray-500" :
                                                                "bg-gray-300 cursor-not-allowed"
                                                )}
                                                onClick={() => togglePortStatus(port)}
                                            >
                                                {port.status === "on" || port.status === "paus" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
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
                />

            )}
        </AppLayout>
    )
}
