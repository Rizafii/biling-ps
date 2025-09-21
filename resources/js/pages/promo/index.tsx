"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { dashboard } from "@/routes"
import { type BreadcrumbItem } from "@/types"
import { Head, useForm } from "@inertiajs/react"
import { Edit, Eye, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Promo", href: dashboard().url },
]

interface Promo {
    id: number
    name: string
    code: string | null
    type: "flat" | "percent" | "time"
    value: number | null
    min_duration: number | null
    is_active: boolean
}

interface Props {
    promos: Promo[]
}

interface PromoFormData {
    name: string
    code: string
    type: "flat" | "percent" | "time"
    value: number | null
    min_duration: number | null
    is_active: boolean
}

interface PromoFormProps {
    data: PromoFormData
    setData: (key: keyof PromoFormData, value: PromoFormData[keyof PromoFormData]) => void
    errors: Record<string, string>
    onSubmit: (e: React.FormEvent) => void
    processing: boolean
    submitLabel: string
    onCancel: () => void
}

function PromoForm({ data, setData, errors, onSubmit, processing, submitLabel, onCancel }: PromoFormProps) {
    const renderValueInput = () => {
        if (data.type === "flat") {
            return (
                <div className="flex items-center">
                    <span className="px-2">Rp</span>
                    <Input
                        type="text"
                        value={data.value ?? ""}
                        onChange={(e) => setData("value", e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1"
                    />
                </div>
            )
        }
        if (data.type === "percent") {
            return (
                <div className="flex items-center">
                    <Input
                        type="text"
                        value={data.value ?? ""}
                        onChange={(e) => setData("value", e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1"
                    />
                    <span className="px-2">%</span>
                </div>
            )
        }
        if (data.type === "time") {
            return (
                <div className="flex items-center">
                    <Input
                        type="text"
                        value={data.value ?? ""}
                        onChange={(e) => setData("value", e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1"
                    />
                    <span className="px-2">menit</span>
                </div>
            )
        }
        return null
    }

    return (
        <form onSubmit={onSubmit}>
            <div className="space-y-6">
                <div className="space-y-3">
                    <div>
                        <Label>Nama Promo</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Contoh: Happy Hour -10%"
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>
                    <div>
                        <Label>Kode Promo</Label>
                        <Input
                            value={data.code}
                            onChange={(e) => setData("code", e.target.value)}
                            placeholder="Contoh: HAPPY10"
                        />
                    </div>
                    <div>
                        <Label>Tipe</Label>
                        <Select value={data.type} onValueChange={(val) => setData("type", val as PromoFormData["type"])}>
                            <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flat">Flat</SelectItem>
                                <SelectItem value="percent">Percent</SelectItem>
                                <SelectItem value="time">Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Nilai</Label>
                        {renderValueInput()}
                    </div>
                    <div>
                        <Label>Min Durasi (menit)</Label>
                        <Input
                            type="text"
                            value={data.min_duration ?? ""}
                            onChange={(e) => setData("min_duration", e.target.value.replace(/[^0-9]/g, ""))}
                        />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select
                            value={data.is_active ? "true" : "false"}
                            onValueChange={(val) => setData("is_active", val === "true")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Aktif</SelectItem>
                                <SelectItem value="false">Nonaktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                    <Button type="submit" disabled={processing}>{submitLabel}</Button>
                </DialogFooter>
            </div>
        </form>
    )
}

export default function Index({ promos }: Props) {
    const { data, setData, post, processing, reset, errors, put, delete: destroy } =
        useForm<PromoFormData>({
            name: "",
            code: "",
            type: "flat",
            value: null,
            min_duration: null,
            is_active: true,
        })

    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<"name" | "type" | "active">("name")
    const [openAdd, setOpenAdd] = useState(false)
    const [openDetail, setOpenDetail] = useState(false)
    const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null)
    const [openEdit, setOpenEdit] = useState(false)

    const filteredPromos = useMemo(() => {
        let data = promos.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.code ?? "").toLowerCase().includes(search.toLowerCase())
        )

        switch (sortBy) {
            case "name":
                return [...data].sort((a, b) => a.name.localeCompare(b.name))
            case "type":
                return [...data].sort((a, b) => a.type.localeCompare(b.type))
            case "active":
                return [...data].sort((a, b) => Number(b.is_active) - Number(a.is_active))
            default:
                return data
        }
    }, [search, sortBy, promos])

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promo" />
            <Card className="m-4">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-2xl font-bold">Manajemen Promo</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Cari promo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-48"
                        />
                        <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nama</SelectItem>
                                <SelectItem value="type">Tipe</SelectItem>
                                <SelectItem value="active">Status Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={() => {
                            setData("name", "")
                            setData("code", "")
                            setData("type", "flat")
                            setData("value", null)
                            setData("min_duration", null)
                            setData("is_active", true)
                            setOpenAdd(true)
                        }}>
                            <Plus className="w-4 h-4 mr-1" /> Tambah
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Nilai</TableHead>
                                <TableHead>Min Durasi</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPromos.map((promo) => (
                                <TableRow key={promo.id}>
                                    <TableCell className="font-medium">{promo.name}</TableCell>
                                    <TableCell>{promo.code ?? "-"}</TableCell>
                                    <TableCell className="capitalize">{promo.type}</TableCell>
                                    <TableCell>
                                        {promo.type === "percent" && `${promo.value}%`}
                                        {promo.type === "flat" && `Rp ${promo.value?.toLocaleString()}`}
                                        {promo.type === "time" && `${promo.value} menit`}
                                    </TableCell>
                                    <TableCell>{promo.min_duration ? `${promo.min_duration} mnt` : "-"}</TableCell>
                                    <TableCell>
                                        {promo.is_active ? (
                                            <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-800">Nonaktif</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedPromo(promo)
                                                    setOpenDetail(true)
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedPromo(promo)
                                                    setData("name", promo.name)
                                                    setData("code", promo.code ?? "")
                                                    setData("type", promo.type)
                                                    setData("value", promo.value ?? null)
                                                    setData("min_duration", promo.min_duration ?? null)
                                                    setData("is_active", promo.is_active)
                                                    setOpenEdit(true)
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (confirm("Yakin ingin menghapus promo ini?")) {
                                                        destroy(`/promo/${promo.id}`)
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Tambah */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Tambah Promo</DialogTitle></DialogHeader>
                    <PromoForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Simpan"
                        onCancel={() => setOpenAdd(false)}
                        onSubmit={(e) => {
                            e.preventDefault()
                            post("/promo", {
                                preserveScroll: true,
                                onSuccess: () => {
                                    reset()
                                    setOpenAdd(false)
                                },
                            })
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Modal Edit */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Edit Promo</DialogTitle></DialogHeader>
                    <PromoForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Update"
                        onCancel={() => setOpenEdit(false)}
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!selectedPromo) return
                            put(`/promo/${selectedPromo.id}`, {
                                preserveScroll: true,
                                onSuccess: () => {
                                    reset()
                                    setOpenEdit(false)
                                },
                            })
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Modal Detail */}
            <Dialog open={openDetail} onOpenChange={setOpenDetail}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Detail Promo</DialogTitle></DialogHeader>
                    {selectedPromo && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Nama</span>
                                <span>{selectedPromo.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Kode</span>
                                <span>{selectedPromo.code ?? "-"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Tipe</span>
                                <span className="capitalize">{selectedPromo.type}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Nilai</span>
                                <span>
                                    {selectedPromo.type === "flat" && `Rp ${selectedPromo.value}`}
                                    {selectedPromo.type === "percent" && `${selectedPromo.value}%`}
                                    {selectedPromo.type === "time" && `${selectedPromo.value} menit`}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Min Durasi</span>
                                <span>{selectedPromo.min_duration ?? "-"}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-medium">Status</span>
                                <span className={selectedPromo.is_active ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                    {selectedPromo.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDetail(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}
