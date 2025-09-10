"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import AppLayout from "@/layouts/app-layout"
import { dashboard } from "@/routes"
import { type BreadcrumbItem } from "@/types"
import { Head, useForm } from "@inertiajs/react"
import { Edit, Eye, Plus, Trash2 } from "lucide-react"
import promo from "@/routes/promo"

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Promo", href: dashboard().url },
]

interface Promo {
    id: number
    name: string
    code: string | null
    type: "flat" | "percent" | "time" | "bundle"
    value: number | null
    min_duration: number | null
    is_active: boolean
}

interface Props {
    promos: Promo[]
}

export default function Index({ promos }: Props) {
    const { data, setData, post, processing, reset, errors, put } = useForm({
        name: "",
        code: "",
        type: "flat",
        value: "",
        min_duration: "",
        is_active: true,
    })
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<"name" | "type" | "active">("name")
    const [openAdd, setOpenAdd] = useState(false)
    const [openDetail, setOpenDetail] = useState(false)
    const [selectedPromo, setSelectedPromo] = useState<typeof promos[0] | null>(null)
    const [openEdit, setOpenEdit] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post("/promo"), {
            onSuccess: () => {
                reset()
                setOpenAdd(false)
            }
        }
    }

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
    }, [search, sortBy])

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promo" />
            <Card>
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
                        <Button onClick={() => setOpenAdd(true)}>
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
                                        {promo.type === "bundle" && "-"}
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
                                                    setData("name", promo.name)
                                                    setData("code", promo.code ?? "")
                                                    setData("type", promo.type)
                                                    setData("value", String(promo.value ?? ""))
                                                    setData("min_duration", String(promo.min_duration ?? ""))
                                                    setData("is_active", promo.is_active)
                                                    setSelectedPromo(promo)
                                                    setOpenEdit(true)
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>

                                            <Button size="sm" variant="destructive">
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

            {/* Modal Tambah Promo */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Promo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
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
                                {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                            </div>

                            <div>
                                <Label>Tipe</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(val) => setData("type", val)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="flat">Flat</SelectItem>
                                        <SelectItem value="percent">Percent</SelectItem>
                                        <SelectItem value="time">Time</SelectItem>
                                        <SelectItem value="bundle">Bundle</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
                            </div>

                            <div>
                                <Label>Nilai</Label>
                                <Input
                                    type="number"
                                    value={data.value}
                                    onChange={(e) => setData("value", e.target.value)}
                                    placeholder="Isi sesuai tipe"
                                />
                                {errors.value && <p className="text-red-500 text-sm">{errors.value}</p>}
                            </div>

                            <div>
                                <Label>Min Durasi (menit)</Label>
                                <Input
                                    type="number"
                                    value={data.min_duration}
                                    onChange={(e) => setData("min_duration", e.target.value)}
                                    placeholder="Opsional"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Batal</Button>
                            <Button type="submit" disabled={processing}>Simpan</Button>
                        </DialogFooter>
                    </form>

                </DialogContent>
            </Dialog>

            {/* Modal Edit Promo */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Promo</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!selectedPromo) return

                            put(`/promo/${selectedPromo.id}`, {
                                onSuccess: () => {
                                    reset()
                                    setOpenEdit(false)
                                },
                            })
                        }}

                    >
                        <div className="space-y-3">
                            <div>
                                <Label>Nama Promo</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                            </div>

                            <div>
                                <Label>Kode Promo</Label>
                                <Input
                                    value={data.code}
                                    onChange={(e) => setData("code", e.target.value)}
                                />
                                {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                            </div>

                            <div>
                                <Label>Tipe</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(val) => setData("type", val)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="flat">Flat</SelectItem>
                                        <SelectItem value="percent">Percent</SelectItem>
                                        <SelectItem value="time">Time</SelectItem>
                                        <SelectItem value="bundle">Bundle</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Nilai</Label>
                                <Input
                                    type="number"
                                    value={data.value}
                                    onChange={(e) => setData("value", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Min Durasi</Label>
                                <Input
                                    type="number"
                                    value={data.min_duration}
                                    onChange={(e) => setData("min_duration", e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Batal</Button>
                            <Button type="submit" disabled={processing}>Update</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>


            {/* Modal Detail Promo */}
            <Dialog open={openDetail} onOpenChange={setOpenDetail}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Promo</DialogTitle>
                    </DialogHeader>
                    {selectedPromo && (
                        <div className="space-y-2">
                            <p><strong>Nama:</strong> {selectedPromo.name}</p>
                            <p><strong>Kode:</strong> {selectedPromo.code ?? "-"}</p>
                            <p><strong>Tipe:</strong> {selectedPromo.type}</p>
                            <p><strong>Nilai:</strong> {selectedPromo.value ?? "-"}</p>
                            <p><strong>Min Durasi:</strong> {selectedPromo.min_duration ?? "-"}</p>
                            <p>
                                <strong>Status:</strong>{" "}
                                {selectedPromo.is_active ? "Aktif" : "Nonaktif"}
                            </p>
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
