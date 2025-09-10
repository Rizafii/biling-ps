"use client"

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
import { Pause, Play, Settings } from "lucide-react"
import { useState } from "react"

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Dashboard",
        href: dashboard().url,
    },
]

export default function Dashboard() {
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedPort, setSelectedPort] = useState<typeof ports[0] | null>(null)
    const ports = [
        { id: "PORT 1", name: "Web Server", duration: "02:15:30", price: "Rp 25.000", status: "on" },
        { id: "PORT 2", name: "Database Server", duration: "01:45:22", price: "Rp 20.000", status: "on" },
        { id: "PORT 3", name: "API Gateway", duration: "00:30:15", price: "Rp 15.000", status: "off" },
        { id: "PORT 4", name: "File Server", duration: "03:22:45", price: "Rp 30.000", status: "on" },
        { id: "PORT 5", name: "Mail Server", duration: "00:00:00", price: "Rp 10.000", status: "idle" },
        { id: "PORT 6", name: "Cache Server", duration: "01:12:33", price: "Rp 18.000", status: "paus" },
        { id: "PORT 7", name: "Load Balancer", duration: "00:00:00", price: "Rp 12.000", status: "off" },
        { id: "PORT 8", name: "Monitoring", duration: "04:05:18", price: "Rp 35.000", status: "on" },
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "on":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On</Badge>
            case "off":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Off</Badge>
            case "idle":
                return <Badge variant="secondary">Idle</Badge>
            case "paus":
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Paus</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const promoList = [
        { id: "tanpa-promo", label: "Tanpa Promo" },
        { id: "promo-1", label: "Promo 1" },
    ]
    const timeFormat = (t: number) => {
        const h = Math.floor(t / 3600)
        const m = Math.floor((t % 3600) / 60)
        const s = t % 60
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Manajemen Port</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Port</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Durasi</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ports.map((port) => (
                                        <TableRow key={port.id}>
                                            <TableCell className="font-medium">{port.id}</TableCell>
                                            <TableCell>{port.name}</TableCell>
                                            <TableCell className="font-mono">{port.duration}</TableCell>
                                            <TableCell className="font-semibold">{port.price}</TableCell>
                                            <TableCell>{getStatusBadge(port.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => {
                                                            setSelectedPort(port)
                                                            setModalOpen(true)
                                                        }}
                                                    >
                                                        <Settings className="w-3 h-3 mr-1" />
                                                        Set/Lihat
                                                    </Button>
                                                    <Button size="sm" className={cn(port.status=="on"?"bg-red-400 hover:bg-red-500":"bg-green-400 hover:bg-green-500")}>
                                                        {port.status=="on"?<Pause className="w-3 h-3" />:<Play className="w-3 h-3" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
            {/* ModalSetPort */}
            {selectedPort && (
                <ModalSetPort
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    stationName={selectedPort.name}
                    statusPort={selectedPort.status === "on" ? "ON" : "OFF"}
                    promoList={promoList}
                    time={0}
                    total={0}
                    billing={0}
                    subtotal={0}
                    diskon={0}
                    timeFormat={timeFormat}
                />
            )}
        </AppLayout>
    )
}
