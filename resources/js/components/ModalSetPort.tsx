"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Play, RotateCcw } from "lucide-react"

interface Promo {
    id: string
    label: string
}

interface ModalSetPortProps {
    isOpen: boolean
    onClose: () => void
    stationName: string
    statusPort: "ON" | "OFF"
    promoList: Promo[]
    time: number
    total: number
    billing: number
    subtotal: number
    diskon: number
    timeFormat: (t: number) => string
}

export function ModalSetPort({
    isOpen,
    onClose,
    stationName,
    statusPort,
    promoList,
    time,
    total,
    billing,
    subtotal,
    diskon,
    timeFormat,
}: ModalSetPortProps) {
    const [customer, setCustomer] = useState("")
    const [hourlyRate, setHourlyRate] = useState("0")
    const [promoScheme, setPromoScheme] = useState("tanpa-promo")
    const [mode, setMode] = useState<"bebas" | "timed">("timed")
    const [hours, setHours] = useState("0")
    const [minutes, setMinutes] = useState("0")

    const isRunning = statusPort === "ON"

    const handleStart = () => {
        console.log({
            customer,
            hourlyRate,
            promoScheme,
            mode,
            hours: mode === "timed" ? hours : "0",
            minutes: mode === "timed" ? minutes : "0",
        })
        onClose()
    }

    const handleReset = () => {
        setCustomer("")
        setHourlyRate("0")
        setPromoScheme("tanpa-promo")
        setMode("timed")
        setHours("0")
        setMinutes("0")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between mr-4">
                        <span>{stationName}</span>
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            {statusPort}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Duration and Total Display */}
                    <div className="flex justify-between items-center">
                        <div>
                            <Label className="text-sm text-gray-600">Durasi</Label>
                            <div className="text-2xl font-mono font-bold">{timeFormat(time)}</div>
                        </div>
                        <div className="text-right">
                            <Label className="text-sm text-gray-600">Total</Label>
                            <div className="text-2xl font-bold">Rp {total}</div>
                        </div>
                    </div>

                    {/* Customer and Rate */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="customer">Pelanggan</Label>
                            <Input
                                id="customer"
                                placeholder="Nama / Kode"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                disabled={isRunning}
                            />
                        </div>
                        <div>
                            <Label htmlFor="rate">Tarif per Jam</Label>
                            <div className="flex items-center rounded-md border px-3">
                                <span className="text-gray-500">Rp</span>
                                <Input
                                    id="rate"
                                    type="text"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value.replace(/[^0-9]/g, ""))}
                                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    disabled={isRunning}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div>
                        <Label className="text-sm font-medium">Mode</Label>
                        <RadioGroup
                            value={mode}
                            onValueChange={(value: "bebas" | "timed") => setMode(value)}
                            className="flex gap-6 mt-2"
                            disabled={isRunning}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bebas" id="bebas" disabled={isRunning} />
                                <Label htmlFor="bebas">Bebas</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="timed" id="timed" disabled={isRunning} />
                                <Label htmlFor="timed">Timed</Label>
                            </div>
                        </RadioGroup>
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
                                value={hours}
                                onChange={(e) => setHours(e.target.value.replace(/[^0-9]/g, ""))}
                                disabled={mode === "bebas" || isRunning}
                                className={mode === "bebas" || isRunning ? "bg-gray-100 text-gray-400" : ""}
                            />
                        </div>
                        <div>
                            <Label htmlFor="minutes">Menit</Label>
                            <Input
                                id="minutes"
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ""))}
                                disabled={mode === "bebas" || isRunning}
                                className={mode === "bebas" || isRunning ? "bg-gray-100 text-gray-400" : ""}
                            />
                        </div>
                    </div>

                    {/* Promo Scheme */}
                    <div>
                        <Label htmlFor="promo">Skema Promo</Label>
                        <Select value={promoScheme} onValueChange={setPromoScheme} disabled={isRunning}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih promo" />
                            </SelectTrigger>
                            <SelectContent>
                                {promoList.map((promo) => (
                                    <SelectItem key={promo.id} value={promo.id}>
                                        {promo.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleStart}
                            className="flex-1 bg-slate-800 hover:bg-slate-700"
                            disabled={isRunning}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Mulai
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="px-6 bg-transparent"
                            disabled={isRunning}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                        <span>Billable: {billing} m</span>
                        <span>Subtotal: Rp {subtotal}</span>
                        <span>Diskon: Rp {diskon}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
