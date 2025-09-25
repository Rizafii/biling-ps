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
import { useEffect, useMemo, useState } from "react"

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Paket", href: dashboard().url },
]

interface Paket {
    id: number
    name: string
    harga: number | null
    duration: number | null
    is_active: boolean
}

interface Props {
    pakets: Paket[]
}

interface PaketFormData {
    name: string
    harga: number | null
    duration: number | null
    is_active: boolean
}

interface PaketFormProps {
    data: PaketFormData
    setData: (key: keyof PaketFormData, value: PaketFormData[keyof PaketFormData]) => void
    errors: Record<string, string>
    onSubmit: (e: React.FormEvent) => void
    processing: boolean
    submitLabel: string
    onCancel: () => void
}

function PaketForm({ data, setData, errors, onSubmit, processing, submitLabel, onCancel }: PaketFormProps) {
    const [localHours, setLocalHours] = useState("")
    const [localMinutes, setLocalMinutes] = useState("")

    // kalau ada data lama (edit), isi awalnya
    useEffect(() => {
        if (data.duration != null) {
            const h = Math.floor(data.duration / 60)
            const m = data.duration % 60
            setLocalHours(h > 0 ? h.toString() : "")
            setLocalMinutes(m > 0 ? m.toString() : "")
        }
    }, [data.duration])

    return (
        <form onSubmit={onSubmit}>
            <div className="space-y-6">
                {/* Nama Paket */}
                <div>
                    <Label>Nama Paket</Label>
                    <Input
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        placeholder="Contoh: Paket Hemat"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                {/* Harga */}
                <div>
                    <Label>Harga</Label>
                    <div className="flex items-center">
                        <span className="px-2">Rp</span>
                        <Input
                            type="text"
                            value={data.harga ?? ""}
                            onChange={(e) => {
                                const angkaBersih = e.target.value.replace(/\D/g, "")
                                setData("harga", angkaBersih ? parseInt(angkaBersih) : null)
                            }}
                            className="flex-1"
                        />
                    </div>
                </div>

                {/* Durasi */}
                <div>
                    <Label>Durasi</Label>
                    <div className="flex items-center gap-2">
                        {/* Jam */}
                        <div className="flex items-center space-x-1">
                            <Input
                                type="text"
                                value={localHours}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "")
                                    setLocalHours(val)

                                    const h = val ? parseInt(val) : 0
                                    const m = localMinutes ? parseInt(localMinutes) : 0
                                    setData("duration", h * 60 + m)
                                }}
                                placeholder="0"
                                className="w-20"
                            />
                            <span>Jam</span>
                        </div>

                        {/* Menit */}
                        <div className="flex items-center space-x-1">
                            <Input
                                type="text"
                                value={localMinutes}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, "")

                                    // max 2 digit
                                    if (val.length > 2) val = val.slice(0, 2)

                                    setLocalMinutes(val)

                                    let m = val ? parseInt(val) : 0
                                    if (m > 59) m = 59
                                    const h = localHours ? parseInt(localHours) : 0
                                    setData("duration", h * 60 + m)
                                }}
                                placeholder="00"
                                className="w-20"
                            />
                            <span>Menit</span>
                        </div>
                    </div>
                    {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
                </div>

                {/* Status */}
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

                {/* Tombol */}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                    <Button type="submit" disabled={processing}>{submitLabel}</Button>
                </DialogFooter>
            </div>
        </form>
    )
}

export default function Index({ pakets }: Props) {
    const { data, setData, post, processing, reset, errors, put, delete: destroy } =
        useForm<PaketFormData>({
            name: "",
            harga: null,
            duration: null,
            is_active: true,
        })

    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<"name" | "harga" | "active">("name")
    const [openAdd, setOpenAdd] = useState(false)
    const [openDetail, setOpenDetail] = useState(false)
    const [selectedPaket, setSelectedPaket] = useState<Paket | null>(null)
    const [openEdit, setOpenEdit] = useState(false)

    const filteredPakets = useMemo(() => {
        let data = pakets.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
        )

        switch (sortBy) {
            case "name":
                return [...data].sort((a, b) => a.name.localeCompare(b.name))
            case "harga":
                return [...data].sort((a, b) => (a.harga ?? 0) - (b.harga ?? 0))
            case "active":
                return [...data].sort((a, b) => Number(b.is_active) - Number(a.is_active))
            default:
                return data
        }
    }, [search, sortBy, pakets])

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paket" />
            <Card className="m-4">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-2xl font-bold">Manajemen Paket</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Cari paket..."
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
                                <SelectItem value="harga">Harga</SelectItem>
                                <SelectItem value="active">Status Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={() => {
                            setData("name", "")
                            setData("harga", null)
                            setData("duration", null)
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
                                <TableHead>Harga</TableHead>
                                <TableHead>Durasi</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        {filteredPakets.length > 0 ? (
                            <TableBody>
                                {filteredPakets.map((paket) => (
                                    <TableRow key={paket.id}>
                                        <TableCell className="font-medium">{paket.name}</TableCell>
                                        <TableCell>
                                            {paket.harga ? `Rp ${paket.harga.toLocaleString()}` : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {paket.duration ? `${paket.duration} menit` : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {paket.is_active ? (
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
                                                        setSelectedPaket(paket)
                                                        setOpenDetail(true)
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedPaket(paket)
                                                        setData("name", paket.name)
                                                        setData("harga", paket.harga ?? null)
                                                        setData("duration", paket.duration ?? null)
                                                        setData("is_active", paket.is_active)
                                                        setOpenEdit(true)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm("Yakin ingin menghapus paket ini?")) {
                                                            destroy(`/paket/${paket.id}`)
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
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                                    {search ? 'Tidak ada paket yang ditemukan' : 'Belum ada data paket'}
                                </TableCell>
                            </TableRow>
                        )}
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Tambah */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Tambah Paket</DialogTitle></DialogHeader>
                    <PaketForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Simpan"
                        onCancel={() => setOpenAdd(false)}
                        onSubmit={(e) => {
                            e.preventDefault()
                            post("/paket", {
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
                    <DialogHeader><DialogTitle>Edit Paket</DialogTitle></DialogHeader>
                    <PaketForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Update"
                        onCancel={() => setOpenEdit(false)}
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!selectedPaket) return
                            put(`/paket/${selectedPaket.id}`, {
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
                    <DialogHeader><DialogTitle>Detail Paket</DialogTitle></DialogHeader>
                    {selectedPaket && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Nama</span>
                                <span>{selectedPaket.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Harga</span>
                                <span>{selectedPaket.harga ? `Rp ${selectedPaket.harga.toLocaleString()}` : "-"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Durasi</span>
                                <span>{selectedPaket.duration ? `${selectedPaket.duration} menit` : "-"}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-medium">Status</span>
                                <span className={selectedPaket.is_active ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                    {selectedPaket.is_active ? "Aktif" : "Nonaktif"}
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
