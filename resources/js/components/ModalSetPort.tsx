"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, FileText, RotateCcw, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Port {
    id: string
    no_port: string
    nama_port: string
    type: string // t = timed, b = bebas, "" = undefined
    nama_pelanggan: string
    duration: string // "HH:MM:SS"
    price: string
    status: "idle" | "on" | "pause" | "off"
    time: number
    total: number
    billing: number
    subtotal: number
    diskon: number
    promoList: { id: string; label: string }[]
    mode: "timed" | "bebas"
    hours: string
    minutes: string
    promoScheme: string
}

interface ModalSetPortProps {
    isOpen: boolean
    onClose: () => void
    port: Port
    onUpdatePort: (updated: Port) => void
    timeFormat: (t: number) => string
}

export function ModalSetPort({ isOpen, onClose, port, onUpdatePort, timeFormat }: ModalSetPortProps) {
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [portData, setPortData] = useState({
        customer: "",
        hourlyRate: "",
        promoScheme: "",
        mode: "timed" as "timed" | "bebas",
        hours: "",
        minutes: "",
    })

    // ✅ Reset form data when modal opens
    const resetFormData = () => {
        setPortData({
            customer: "",
            hourlyRate: "",
            promoScheme: "tanpa-promo", // Set default promo
            mode: "timed",
            hours: "",
            minutes: "",
        })
    }

    useEffect(() => {
        if (isOpen && port) {
            if (port.status === "idle") {
                // ✅ Jika port idle, reset form ke kosong
                resetFormData()
            } else {
                // ✅ Jika port sedang aktif, ambil data dari port
                setPortData({
                    customer: port.nama_pelanggan || "",
                    hourlyRate: port.price || "",
                    promoScheme: port.promoScheme || "tanpa-promo",
                    mode: port.mode,
                    hours: port.hours || "",
                    minutes: port.minutes || "",
                })
            }
        }
    }, [isOpen, port])

    // ✅ Konversi jam dan menit ke detik (bukan menit)
    function jamMenitToDetik(hours: string, minutes: string): number {
        const h = parseInt(hours || "0", 10)
        const m = parseInt(minutes || "0", 10)
        return (h * 3600) + (m * 60) // Convert to seconds
    }

    // ✅ Hitung total berdasarkan tarif per jam
    function hitungTotal(hourlyRate: string, timeInSeconds: number, mode: string): number {
        const tarif = parseInt(hourlyRate.replace(/\./g, "")) || 0

        if (mode === "timed") {
            return 0 // Untuk timed, total dihitung saat countdown
        } else {
            // Untuk bebas, hitung berdasarkan waktu yang sudah berjalan
            const jam = timeInSeconds / 3600 // Convert seconds to hours
            let total = Math.round(tarif * jam)

            // Pembulatan ke atas ke 100 terdekat
            const sisa = total % 100
            if (sisa !== 0) total = total + (100 - sisa)

            return total
        }
    }

    const handleStart = () => {
        if (!portData.customer.trim()) {
            alert("Nama pelanggan wajib diisi")
            return
        }
        if (!portData.hourlyRate) {
            alert("Tarif per jam wajib diisi")
            return
        }

        let totalSeconds = 0
        let billingSeconds = 0

        if (portData.mode === "timed") {
            totalSeconds = jamMenitToDetik(portData.hours, portData.minutes)
            billingSeconds = totalSeconds
            if (totalSeconds <= 0) {
                alert("Jam atau menit harus diisi untuk mode timed")
                return
            }
        }

        const updatedPort: Port = {
            ...port,
            nama_pelanggan: portData.customer,
            price: portData.hourlyRate,
            promoScheme: portData.promoScheme,
            mode: portData.mode,
            hours: portData.hours,
            minutes: portData.minutes,
            type: portData.mode === "timed" ? "t" : "b",
            status: "on",
            time: totalSeconds, // Time in seconds
            billing: billingSeconds,
            total: hitungTotal(portData.hourlyRate, totalSeconds, portData.mode),
            subtotal: hitungTotal(portData.hourlyRate, totalSeconds, portData.mode),
            diskon: 0,
        }

        onUpdatePort(updatedPort)
        onClose()
    }

    const handlePause = () => {
        onUpdatePort({
            ...port,
            status: port.status === "pause" ? "on" : "pause"
        })
    }

    const handleFinish = () => {
        // ✅ Set port ke idle dan reset semua data
        const finishedPort: Port = {
            ...port,
            nama_pelanggan: "",
            price: "",
            status: "idle",
            time: 0,
            billing: 0,
            total: 0,
            subtotal: 0,
            diskon: 0,
            hours: "0",
            minutes: "0",
            type: "",
            promoScheme: "tanpa-promo",
            mode: "timed",
        }

        onUpdatePort(finishedPort)
        resetFormData() // ✅ Reset form juga
        onClose()
    }

    const handleReset = () => {
        // ✅ Reset port dan form data
        const resetPort: Port = {
            ...port,
            nama_pelanggan: "",
            price: "",
            status: "idle",
            time: 0,
            billing: 0,
            total: 0,
            subtotal: 0,
            diskon: 0,
            hours: "0",
            minutes: "0",
            type: "",
            promoScheme: "tanpa-promo",
            mode: "timed",
        }

        onUpdatePort(resetPort)
        resetFormData() // ✅ Reset form juga
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between mr-4">
                        <span>{port.nama_port}</span>
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            {port.status}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Duration & Total */}
                    <div className="flex justify-between items-center">
                        <div>
                            <Label className="text-sm text-gray-600">Durasi</Label>
                            <div className="text-2xl font-mono font-bold">{timeFormat(port.time)}</div>
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
                                onChange={(e) => setPortData(prev => ({ ...prev, customer: e.target.value }))}
                                disabled={port.status !== "idle"}
                                className={port.status !== "idle" ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""}
                            />
                        </div>
                        <div>
                            <Label htmlFor="rate">Tarif per Jam</Label>
                            <div className="flex items-center rounded-md border pl-3">
                                <span className="text-gray-500 pr-2">Rp</span>
                                <Input
                                    id="rate"
                                    type="text"
                                    placeholder="0"
                                    value={portData.hourlyRate}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "")
                                        const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                                        setPortData(prev => ({ ...prev, hourlyRate: formatted }))
                                    }}
                                    disabled={port.status !== "idle"}
                                    className={cn(
                                        "border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-none",
                                        port.status !== "idle" ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""
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
                            onValueChange={(val) => setPortData(prev => ({ ...prev, mode: val as "timed" | "bebas" }))}
                            disabled={port.status !== "idle"}
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

                    {/* Time Input - ✅ Fixed: Input sekarang benar */}
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
                                    const value = e.target.value.replace(/[^0-9]/g, "")
                                    setPortData(prev => ({ ...prev, hours: value }))
                                }}
                                disabled={portData.mode === "bebas" || port.status !== "idle"}
                                className={portData.mode === "bebas" || port.status !== "idle" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
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
                                    const value = e.target.value.replace(/[^0-9]/g, "")
                                    // ✅ Validasi menit tidak lebih dari 59
                                    const numValue = parseInt(value || "0", 10)
                                    if (numValue <= 59) {
                                        setPortData(prev => ({ ...prev, minutes: value }))
                                    }
                                }}
                                disabled={portData.mode === "bebas" || port.status !== "idle"}
                                className={portData.mode === "bebas" || port.status !== "idle" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                            />
                        </div>
                    </div>

                    {/* Promo */}
                    <div>
                        <Label htmlFor="promo">Skema Promo</Label>
                        <Select
                            value={portData.promoScheme}
                            onValueChange={(val) => setPortData(prev => ({ ...prev, promoScheme: val }))}
                            disabled={port.status !== "idle"}
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
                        {port.status === "off" ? (
                            <div className="flex-1 text-center text-red-500 font-semibold">
                                Port Sedang Off
                            </div>
                        ) : port.status === "idle" ? (
                            <Button onClick={handleStart} className="flex-1 bg-blue-500 hover:bg-blue-600">
                                <Play className="w-4 h-4 mr-2" />
                                Mulai
                            </Button>
                        ) : (
                            <>
                                {port.status === "pause" ? (
                                    <Button onClick={handlePause} className="flex-1 bg-green-500 hover:bg-green-600">
                                        <Play className="w-4 h-4 mr-2" />
                                        Resume
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => setConfirmOpen(true)}
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                                    >
                                        <Pause className="w-4 h-4 mr-2" />
                                        Pause
                                    </Button>

                                )}
                                <Button onClick={handleFinish} className="flex-1 bg-green-500 hover:bg-green-600">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Selesai & Nota
                                </Button>
                                <Button variant="outline" onClick={handleReset} className="px-6 bg-transparent">
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                        <span>Billable: {Math.floor(port.billing / 60)}:{(port.billing % 60).toString().padStart(2, '0')}</span>
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
                            <DialogTitle className="text-lg font-semibold">
                                Konfirmasi Pause
                            </DialogTitle>
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
                                    onUpdatePort({ ...port, status: "pause" })
                                    setConfirmOpen(false)
                                }}
                            >
                                Lanjutkan
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </Dialog>
    )
}
