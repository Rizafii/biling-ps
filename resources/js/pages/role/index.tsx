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
    { title: "Role", href: dashboard().url },
]

interface Role {
    id: number
    name: string
    guard_name: string
}

interface Props {
    roles: Role[]
}

interface RoleFormData {
    name: string
    guard_name: string
}

interface RoleFormProps {
    data: RoleFormData
    setData: (key: keyof RoleFormData, value: RoleFormData[keyof RoleFormData]) => void
    errors: Record<string, string>
    onSubmit: (e: React.FormEvent) => void
    processing: boolean
    submitLabel: string
    onCancel: () => void
    isEdit?: boolean
}

function RoleForm({ data, setData, errors, onSubmit, processing, submitLabel, onCancel, isEdit }: RoleFormProps) {
    return (
        <form onSubmit={onSubmit}>
            <div className="space-y-6">
                <div className="space-y-3">
                    {/* Nama Role */}
                    <div>
                        <Label>Nama Role</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Nama role"
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    {/* Guard Name */}
                    <div>
                        <Label>Guard Name</Label>
                        <Select
                            value={data.guard_name}
                            onValueChange={(val) => setData("guard_name", val)}
                        >
                            <SelectTrigger><SelectValue placeholder="Pilih guard" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="web">Web</SelectItem>
                                <SelectItem value="api">API</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.guard_name && <p className="text-red-500 text-sm">{errors.guard_name}</p>}
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

export default function RoleIndex({ roles }: Props) {
    const { data, setData, post, processing, reset, errors, put, delete: destroy } =
        useForm<RoleFormData>({
            name: "",
            guard_name: "web",
        })

    const [search, setSearch] = useState("")
    const [openAdd, setOpenAdd] = useState(false)
    const [openDetail, setOpenDetail] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [openEdit, setOpenEdit] = useState(false)

    const filteredRoles = useMemo(() => {
        return roles.filter(
            (r) =>
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                r.guard_name.toLowerCase().includes(search.toLowerCase())
        )
    }, [search, roles])

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role" />
            <Card className="m-4">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-2xl font-bold">Manajemen Role</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Cari role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-48"
                        />
                        <Button onClick={() => {
                            reset()
                            setData("guard_name", "web")
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
                                <TableHead>Guard</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        {filteredRoles.length > 0 ? (
                            <TableBody>
                                {filteredRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{role.guard_name}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedRole(role)
                                                        setOpenDetail(true)
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedRole(role)
                                                        setData("name", role.name)
                                                        setData("guard_name", role.guard_name)
                                                        setOpenEdit(true)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm("Yakin ingin menghapus role ini?")) {
                                                            destroy(`/role/${role.id}`)
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
                                <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                                    {search ? 'Tidak ada role yang ditemukan' : 'Belum ada data role'}
                                </TableCell>
                            </TableRow>
                        )}
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Tambah */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Tambah Role</DialogTitle></DialogHeader>
                    <RoleForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Simpan"
                        onCancel={() => setOpenAdd(false)}
                        onSubmit={(e) => {
                            e.preventDefault()
                            post("/role", {
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
                    <DialogHeader><DialogTitle>Edit Role</DialogTitle></DialogHeader>
                    <RoleForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Update"
                        isEdit
                        onCancel={() => setOpenEdit(false)}
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!selectedRole) return
                            put(`/role/${selectedRole.id}`, {
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
                    <DialogHeader><DialogTitle>Detail Role</DialogTitle></DialogHeader>
                    {selectedRole && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Nama</span>
                                <span>{selectedRole.name}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-medium">Guard</span>
                                <span className="capitalize">{selectedRole.guard_name}</span>
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
