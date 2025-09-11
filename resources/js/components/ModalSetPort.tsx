"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, FileText, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Port {
    id: string
    no_port: string
    nama_port: string
    type: string // t = timed, b = bebas, "" = undefined
    nama_pelanggan: string
    duration: string // "HH:MM:SS"
    price: string
    status: "idle" | "on" | "paus" | "off"
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
    timeFormat: (t: number) => string
}

export function ModalSetPort({ isOpen, onClose, port, timeFormat }: ModalSetPortProps) {
    const [portData, setPortData] = useState({
        customer: "",
        hourlyRate: "",
        promoScheme: "",
        mode: "timed" as "timed" | "bebas",
        hours: "",
        minutes: "",
    })

    function formatMinutesToHHMMSS(totalMinutes: number): string {
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const seconds = 0 // karena inputnya menit, detik default 0

        const hh = hours.toString().padStart(2, "0")
        const mm = minutes.toString().padStart(2, "0")
        const ss = seconds.toString().padStart(2, "0")

        return `${hh}:${mm}:${ss}`
    }

    useEffect(() => {
        if (isOpen && port) {
            setPortData({
                customer: port.nama_pelanggan || "",
                hourlyRate: port.price || "",
                promoScheme: port.promoScheme || "",
                mode: port.mode,
                hours: port.hours || "",
                minutes: port.minutes || "",
            })
        }
    }, [isOpen, port])

    const handleStart = () => console.log("Start Port:", portData)
    const handlePause = () => console.log("Pause Port:", portData)
    const handleFinish = () => console.log("Finish & Nota:", portData)
    const handleReset = () =>
        setPortData({ customer: "", hourlyRate: "", promoScheme: "", mode: "timed", hours: "", minutes: "" })

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
                            <div className="text-2xl font-mono font-bold">{formatMinutesToHHMMSS(port.time)}</div>
                        </div>
                        <div className="text-right">
                            <Label className="text-sm text-gray-600">Total</Label>
                            <div className="text-2xl font-bold">Rp {port.total}</div>
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
                                    value={portData.hourlyRate}
                                    onChange={(e) =>
                                        setPortData(prev => ({ ...prev, hourlyRate: e.target.value.replace(/[^0-9]/g, "") }))
                                    }
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

                    {/* Time Input */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="hours">Jam</Label>
                            <Input
                                id="hours"
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                value={portData.hours}
                                onChange={(e) => setPortData(prev => ({ ...prev, hours: e.target.value.replace(/[^0-9]/g, "") }))}
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
                                maxLength={2}
                                value={portData.minutes}
                                onChange={(e) => setPortData(prev => ({ ...prev, minutes: e.target.value.replace(/[^0-9]/g, "") }))}
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
                                <Button onClick={handlePause} className="flex-1 bg-yellow-500 hover:bg-yellow-600">
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                </Button>
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
                        <span>Billable: {port.billing} m</span>
                        <span>Subtotal: Rp {port.subtotal}</span>
                        <span>Diskon: Rp {port.diskon}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
