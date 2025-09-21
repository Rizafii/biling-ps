"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from "recharts"
import { DollarSign, Users, Clock, Gamepad2, TrendingUp, Calendar } from "lucide-react"
import { useState } from "react"
import AppLayout from "@/layouts/app-layout"
import { dashboard } from "@/routes"
import { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { cn } from "@/lib/utils"
import { CustomTooltip } from "@/components/toolTip"

// Dummy data
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

interface Statistik {
    pendapatanHariIni: number
    pendapatanKemarin: number
    sesiHariIni: number
    sesiKemarin: number
    totalJamMainHariIni: number
    totalJamMainKemarin: number
}

interface PendapatanHarian {
    tanggal: string
    pendapatan: number
    jumlah_sesi: number
}

interface PendapatanBulanan {
    tanggal: string
    pendapatan: number
}

interface PortProps {
    port: string
    total: number
}

interface PromoProps {
    nama: string
    total: number
}

interface ModeProps {
    nama: string
    nilai: number
    [key: string]: string | number // <- tambahin ini
}

interface ModeData {
    dataModeHariIni: ModeProps[],
    dataModeBulanIni: ModeProps[],
}

interface PemakaianPort {
    pemakaianPortHariIni: PortProps[]
    pemakaianPortBulanIni: PortProps[]
}

interface PemakaianPromo {
    pemakaianPromoHariIni: PromoProps[]
    pemakaianPromoBulanIni: PromoProps[]
}


export interface DashboardProps {
    statistik: Statistik
    pendapatanHarian: PendapatanHarian[]
    pendapatanBulanan: PendapatanBulanan[]
    pemakaianPort: PemakaianPort
    pemakaianPromo: PemakaianPromo
    hariIni: string
    modeData: ModeData
}


export default function Dashboard({ statistik, pendapatanHarian, pendapatanBulanan, pemakaianPort, pemakaianPromo, hariIni, modeData }: DashboardProps) {
    const [revenueView, setRevenueView] = useState<"7days" | "30days">("7days")

    const [portView, setPortView] = useState<"hariIni" | "bulanIni">("hariIni")
    const [promoView, setPromoView] = useState<"hariIni" | "bulanIni">("hariIni")

    const [modeView, setModeView] = useState<"hariIni" | "bulanIni">("hariIni")

    const currentModeData = modeView === "hariIni" ? modeData.dataModeHariIni : modeData.dataModeBulanIni
    // ...
    const currentRevenueData = revenueView === "7days" ? pendapatanHarian : pendapatanBulanan
    const currentPortData = portView === "hariIni" ? pemakaianPort.pemakaianPortHariIni : pemakaianPort.pemakaianPortBulanIni
    const currentPromoData = promoView === "hariIni" ? pemakaianPromo.pemakaianPromoHariIni : pemakaianPromo.pemakaianPromoBulanIni

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value)
    }

    const formatRevenueInRb = (value: number) => {
        return `${(value / 1000).toFixed(0)}Rb`
    }

    // Mapping Color
    const topColors = [
        "#ef4444", // merah
        "#3b82f6", // biru
        "#22c55e", // hijau
        "#eab308", // kuning
        "#a855f7", // ungu
        "#f97316", // oranye
        "#06b6d4", // cyan
        "#84cc16", // lime
    ];
    const otherColor = "#6b7280"; // abu-abu

    const portUsageWithColors = currentPortData.map((item, index) => ({
        ...item,
        color: index < 8 ? topColors[index] : otherColor,
    })) ?? []

    const promoUsageWithColors = currentPromoData.map((item, index) => ({
        ...item,
        color: index < 8 ? topColors[index] : otherColor,
    })) ?? []


    const cardBg = getComputedStyle(document.documentElement)
        .getPropertyValue("--card")
        .trim()

    const border = getComputedStyle(document.documentElement)
        .getPropertyValue("--border")
        .trim()

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <Card className="m-4">
                <div className="min-h-screen bg-background">
                    {/* Header */}

                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 pb-4">
                        <CardTitle className="text-2xl font-bold">PlayStation Dashboard</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                Hari ini {hariIni}
                            </Badge>
                        </div>
                    </CardHeader>

                    <main className=" mx-6 py-6 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pendapatan */}
                            <Card className="bg-gradient-to-br from-emerald-500/90 to-emerald-600 text-white dark:from-emerald-600 dark:to-emerald-700 dark:text-white shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium opacity-90">Pendapatan Hari Ini</CardTitle>
                                    <DollarSign className="h-4 w-4 opacity-90" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {statistik.pendapatanHariIni !== undefined ? `Rp ${statistik.pendapatanHariIni}` : "-"}
                                    </div>
                                    <p className="text-xs opacity-90 mt-1">
                                        <TrendingUp className="h-3 w-3 inline mr-1" />
                                        kemarin : {statistik.pendapatanKemarin !== undefined ? `Rp ${statistik.pendapatanKemarin}` : "-"}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Sesi */}
                            <Card className="bg-gradient-to-br from-blue-500/90 to-blue-600 text-white dark:from-blue-600 dark:to-blue-700 dark:text-white shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium opacity-90">Sesi Hari Ini</CardTitle>
                                    <Users className="h-4 w-4 opacity-90" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {statistik.sesiHariIni !== undefined ? `${statistik.sesiHariIni} Sesi` : "-"}
                                    </div>
                                    <p className="text-xs opacity-90 mt-1">
                                        <TrendingUp className="h-3 w-3 inline mr-1" />
                                        kemarin : {statistik.sesiKemarin !== undefined ? `${statistik.sesiKemarin} Sesi` : "-"}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Total Jam */}
                            <Card className="bg-gradient-to-br from-gray-500/90 to-gray-600 text-white dark:from-gray-600 dark:to-gray-700 dark:text-white shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium opacity-90">Total Jam Main</CardTitle>
                                    <Clock className="h-4 w-4 opacity-90" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {statistik.totalJamMainHariIni !== undefined ? `${statistik.totalJamMainHariIni} Jam` : "-"}
                                    </div>
                                    <p className="text-xs opacity-90 mt-1">
                                        <TrendingUp className="h-3 w-3 inline mr-1" />
                                        kemarin : {statistik.totalJamMainKemarin !== undefined ? `${statistik.totalJamMainKemarin} Jam` : "-"}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>


                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Chart */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold">Pendapatan Harian</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={revenueView === "7days" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setRevenueView("7days")}
                                            >
                                                7 Hari
                                            </Button>
                                            <Button
                                                variant={revenueView === "30days" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setRevenueView("30days")}
                                            >
                                                30 Hari
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <div className={cn(revenueView == "7days" ? "min-w-[500px]" : "min-w-[1000px]")}>
                                            <ResponsiveContainer width="100%" height={300}>
                                                {currentRevenueData.length > 0 ? (
                                                    <LineChart data={currentRevenueData}>
                                                        <CartesianGrid strokeDasharray="2 5" className="opacity-30" />
                                                        <XAxis dataKey="tanggal" className="text-xs" tick={{ fontSize: 12 }} />
                                                        <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={formatRevenueInRb} />
                                                        <Tooltip
                                                            content={<CustomTooltip formatter={(value: number) => [formatCurrency(value), "Pendapatan"]} />}
                                                        />

                                                        <Line
                                                            type="monotone"
                                                            dataKey="pendapatan"
                                                            stroke="#3b82f6"
                                                            strokeWidth={3}
                                                            dot={{ fill: "#ffffff", strokeWidth: 2, r: 4 }}
                                                            activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                                                        />
                                                    </LineChart>
                                                ) : (
                                                    <div className="flex justify-center items-center h-full text-gray-400">Tidak ada data yang tersedia</div>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* port Usage Chart */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold">Port Paling Sering Dipakai</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={portView === "hariIni" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPortView("hariIni")}
                                            >
                                                Hari Ini
                                            </Button>
                                            <Button
                                                variant={portView === "bulanIni" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPortView("bulanIni")}
                                            >
                                                Bulan Ini
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Port Usage Chart */}
                                    <ResponsiveContainer width="100%" height={300}>
                                        {currentPortData.length > 0 ? (
                                            <BarChart data={currentPortData} layout="vertical">
                                                <CartesianGrid strokeDasharray="2 5" className="opacity-30" />
                                                <XAxis type="number" dataKey="total" tick={{ fontSize: 12 }} />
                                                <YAxis type="category" dataKey="port" tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip formatter={(value: number) => [`${value} penggunaan`, "Penggunaan"]} />} />
                                                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                                    {portUsageWithColors.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <div className="flex justify-center items-center h-full text-gray-400">Tidak ada data yang tersedia</div>
                                        )}
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold">Promo Paling Sering Digunakan</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={promoView === "hariIni" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPromoView("hariIni")}
                                            >
                                                Hari Ini
                                            </Button>
                                            <Button
                                                variant={promoView === "bulanIni" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPromoView("bulanIni")}
                                            >
                                                Bulan Ini
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        {currentPromoData.length > 0 ? (
                                            <BarChart data={currentPromoData}>
                                                <CartesianGrid strokeDasharray="2 5" className="opacity-30" />
                                                <XAxis dataKey="nama" className="text-xs" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                                                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip formatter={(value: number) => [`${value} promo`, "Penggunaan"]} />} />
                                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                    {promoUsageWithColors.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <div className="flex justify-center items-center h-full text-gray-400">Tidak ada data yang tersedia</div>
                                        )}
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Mode */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold">
                                            Perbandingan Mode Bebas vs Timer
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={modeView === "hariIni" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setModeView("hariIni")}
                                            >
                                                Hari Ini
                                            </Button>
                                            <Button
                                                variant={modeView === "bulanIni" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setModeView("bulanIni")}
                                            >
                                                Bulan Ini
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        {currentModeData.length > 0 ? (
                                            <PieChart>
                                                <Pie
                                                    data={currentModeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    dataKey="nilai"
                                                    nameKey="nama"
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                    labelLine={false}
                                                >
                                                    {currentModeData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={index === 0 ? "#4ade80" : "#60a5fa"} // Hijau untuk Bebas, biru untuk Timer
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip formatter={(value: number) => [`${value} x`, "Jumlah Billing"]} />} />
                                            </PieChart>
                                        ) : (
                                            <div className="flex justify-center items-center h-full text-gray-400">Tidak ada data yang tersedia</div>
                                        )}
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                        </div>
                    </main>
                </div>
            </Card>

        </AppLayout>
    );
}
