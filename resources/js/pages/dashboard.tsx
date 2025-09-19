"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts"
import { DollarSign, Users, Clock, Gamepad2, TrendingUp, Calendar } from "lucide-react"
import { useState } from "react"
import AppLayout from "@/layouts/app-layout"
import { dashboard } from "@/routes"
import { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { cn } from "@/lib/utils"

// Dummy data
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];
const dailyRevenueData = [
    { day: "Sen", revenue: 250000, sessions: 45 },
    { day: "Sel", revenue: 320000, sessions: 52 },
    { day: "Rab", revenue: 280000, sessions: 48 },
    { day: "Kam", revenue: 410000, sessions: 67 },
    { day: "Jum", revenue: 520000, sessions: 78 },
    { day: "Sab", revenue: 680000, sessions: 95 },
    { day: "Min", revenue: 590000, sessions: 87 },
]

const monthlyRevenueData = [
    { day: "1", revenue: 250000 },
    { day: "2", revenue: 320000 },
    { day: "3", revenue: 280000 },
    { day: "4", revenue: 410000 },
    { day: "5", revenue: 520000 },
    { day: "6", revenue: 680000 },
    { day: "7", revenue: 590000 },
    { day: "8", revenue: 420000 },
    { day: "9", revenue: 380000 },
    { day: "10", revenue: 450000 },
    { day: "11", revenue: 510000 },
    { day: "12", revenue: 620000 },
    { day: "13", revenue: 580000 },
    { day: "14", revenue: 490000 },
    { day: "15", revenue: 550000 },
    { day: "16", revenue: 610000 },
    { day: "17", revenue: 570000 },
    { day: "18", revenue: 480000 },
    { day: "19", revenue: 530000 },
    { day: "20", revenue: 640000 },
    { day: "21", revenue: 720000 },
    { day: "22", revenue: 690000 },
    { day: "23", revenue: 560000 },
    { day: "24", revenue: 680000 },
    { day: "25", revenue: 750000 },
    { day: "26", revenue: 820000 },
    { day: "27", revenue: 780000 },
    { day: "28", revenue: 650000 },
    { day: "29", revenue: 710000 },
    { day: "30", revenue: 890000 },
]

const consoleUsageData = [
    { console: "PS5", usage: 45, color: "#164e63" },
    { console: "PS4", usage: 38, color: "#f97316" },
    { console: "PS3", usage: 12, color: "#0891b2" },
    { console: "PS2", usage: 5, color: "#ea580c" },
    { console: "PS5", usage: 45, color: "#164e63" },
    { console: "PS2", usage: 5, color: "#ea580c" },
    { console: "PS3", usage: 12, color: "#0891b2" },
    { console: "PS4", usage: 38, color: "#f97316" },
]

const promoUsageData = [
    { name: "Paket 3 Jam", value: 35, count: 142, color: "#164e63" },
    { name: "Promo Weekend", value: 28, count: 98, color: "#f97316" },
    { name: "Member Bulanan", value: 22, count: 76, color: "#0891b2" },
    { name: "Promo Pelajar", value: 15, count: 52, color: "#ea580c" },
    { name: "Promo Pelajar", value: 15, count: 52, color: "#ea580c" },
    { name: "Member Bulanan", value: 22, count: 76, color: "#0891b2" },
    { name: "Promo Pelajar", value: 15, count: 52, color: "#ea580c" },
]

export default function Dashboard() {

    const [revenueView, setRevenueView] = useState<"7days" | "30days">("7days")

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

    const currentRevenueData = revenueView === "7days" ? dailyRevenueData : monthlyRevenueData

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <Card className="m-4">
                <div className="min-h-screen bg-background">
                    {/* Header */}
                    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary rounded-lg">
                                        <Gamepad2 className="h-6 w-6 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-foreground">PlayStation Dashboard</h1>
                                        <p className="text-sm text-muted-foreground">Monitor penggunaan dan pendapatan</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Hari ini
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="container mx-auto px-4 py-6 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium opacity-90">Pendapatan Hari Ini</CardTitle>
                                    <DollarSign className="h-4 w-4 opacity-90" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Rp 5.900.000</div>
                                    <p className="text-xs opacity-90 mt-1">
                                        <TrendingUp className="h-3 w-3 inline mr-1" />
                                        +12% dari kemarin
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium opacity-90">Sesi Hari Ini</CardTitle>
                                    <Users className="h-4 w-4 opacity-90" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">87 Sesi</div>
                                    <p className="text-xs opacity-90 mt-1">
                                        <TrendingUp className="h-3 w-3 inline mr-1" />
                                        +8% dari kemarin
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium opacity-90">Total Jam Main</CardTitle>
                                    <Clock className="h-4 w-4 opacity-90" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">342 Jam</div>
                                    <p className="text-xs opacity-90 mt-1">
                                        <TrendingUp className="h-3 w-3 inline mr-1" />
                                        +15% dari kemarin
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
                                                <LineChart data={currentRevenueData}>
                                                    <CartesianGrid strokeDasharray="2 5" className="opacity-30" />
                                                    <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 12 }} />
                                                    <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={formatRevenueInRb} />
                                                    <Tooltip
                                                        formatter={(value: number) => [formatCurrency(value), "Pendapatan"]}
                                                        labelStyle={{ color: "hsl(var(--foreground))" }}
                                                        contentStyle={{
                                                            backgroundColor: "hsl(var(--card))",
                                                            border: "1px solid hsl(var(--border))",
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="revenue"
                                                        stroke="#ffffff"
                                                        strokeWidth={3}
                                                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Console Usage Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Port Paling Sering Dipakai</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="">
                                        <div className="min-w-[300px]">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={consoleUsageData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                    <XAxis type="number" dataKey="usage" tick={{ fontSize: 12 }} />
                                                    <YAxis type="category" dataKey="console" tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        formatter={(value: number) => [`${value}%`, "Penggunaan"]}
                                                        labelStyle={{ color: "hsl(var(--foreground))" }}
                                                        contentStyle={{
                                                            backgroundColor: "hsl(var(--card))",
                                                            border: "1px solid hsl(var(--border))",
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                    <Bar dataKey="usage" radius={[0, 4, 4, 0]}>
                                                        {consoleUsageData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>

                                            </ResponsiveContainer>

                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Promo Usage Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Promo Paling Sering Digunakan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="">
                                        <div className="min-w-[300px]">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={promoUsageData}>
                                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                    <XAxis
                                                        dataKey="name"
                                                        className="text-xs"
                                                        tick={{ fontSize: 10 }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        formatter={(value: number, name: string, props: any) => [
                                                            `${props.payload.count} promo digunakan (${value}%)`,
                                                            "Jumlah Penggunaan",
                                                        ]}
                                                        labelStyle={{ color: "hsl(var(--foreground))" }}
                                                        contentStyle={{
                                                            backgroundColor: "hsl(var(--card))",
                                                            border: "1px solid hsl(var(--border))",
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                        {promoUsageData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>

                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Statistik Cepat</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Users className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Rata-rata Sesi/Hari</p>
                                                <p className="text-xs text-muted-foreground">7 hari terakhir</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold">67</p>
                                            <p className="text-xs text-green-600">+5.2%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-secondary/10 rounded-lg">
                                                <Clock className="h-4 w-4 text-secondary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Durasi Rata-rata</p>
                                                <p className="text-xs text-muted-foreground">Per sesi</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold">3.9 jam</p>
                                            <p className="text-xs text-green-600">+0.3 jam</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent/10 rounded-lg">
                                                <DollarSign className="h-4 w-4 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Pendapatan/Jam</p>
                                                <p className="text-xs text-muted-foreground">Rata-rata</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold">Rp 17.250</p>
                                            <p className="text-xs text-green-600">+8.5%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </Card>

        </AppLayout>
    );
}
