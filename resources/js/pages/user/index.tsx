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
    { title: "User", href: dashboard().url },
]

interface Role {
    id: number
    name: string
    guard_name?: string
}

interface User {
    id: number
    name: string
    email: string
    role_id: string
    roles: Role[]
}

interface Props {
    users: User[]
    roles: Role[]
}

interface UserFormData {
    name: string
    email: string
    password: string
    role_id: string
}

interface UserFormProps {
    data: UserFormData
    setData: (key: keyof UserFormData, value: UserFormData[keyof UserFormData]) => void
    errors: Record<string, string>
    onSubmit: (e: React.FormEvent) => void
    processing: boolean
    submitLabel: string
    onCancel: () => void
    isEdit?: boolean
    roles: Role[]
}

function UserForm({ data, setData, errors, onSubmit, processing, submitLabel, onCancel, isEdit, roles }: UserFormProps) {
    return (
        <form onSubmit={onSubmit}>
            <div className="space-y-6">
                <div className="space-y-3">
                    <div>
                        <Label>Nama</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Nama user"
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="email@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                    <div>
                        <Label>
                            Password{" "}
                            {isEdit && <span className="text-xs text-gray-500">(kosongkan jika tidak ingin ganti)</span>}
                        </Label>
                        <Input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                            placeholder="********"
                        />
                    </div>
                    <div>
                        <Label>Role</Label>
                        <Select
                            value={data.role_id}
                            onValueChange={(val) => setData("role_id", val)}
                        >
                            <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                        {role.name} {role.guard_name && `(${role.guard_name})`}
                                    </SelectItem>
                                ))}
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

export default function Index({ users, roles }: Props) {
    const { data, setData, post, processing, reset, errors, put, delete: destroy } =
        useForm<UserFormData>({
            name: "",
            email: "",
            password: "",
            role_id: roles.length > 0 ? String(roles[0].id) : "",
        })

    const [search, setSearch] = useState("")
    const [openAdd, setOpenAdd] = useState(false)
    const [openDetail, setOpenDetail] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [openEdit, setOpenEdit] = useState(false)

    const filteredUsers = useMemo(() => {
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
        )
    }, [search, users])

    function formatRole(roleId: string | number, roles: Role[]) {
        const role = roles.find((r) => String(r.id) === String(roleId))
        if (!role) return String(roleId)
        return role.guard_name ? `${role.name} (${role.guard_name})` : role.name
    }


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User" />
            <Card className="m-4">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-2xl font-bold">Manajemen User</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Cari user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-48"
                        />
                        <Button onClick={() => {
                            reset()
                            setData("role_id", roles.length > 0 ? String(roles[0].id) : "")
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
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        {filteredUsers.length > 0 ? (
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="capitalize">
                                            <Badge>
                                                {user.roles && user.roles.length > 0
                                                    ? formatRole(user.roles[0].id, roles)
                                                    : formatRole(user.role_id, roles)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setOpenDetail(true)
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setData("name", user.name)
                                                        setData("email", user.email)
                                                        setData("password", "")
                                                        setData("role_id", String(user.role_id))
                                                        setOpenEdit(true)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm("Yakin ingin menghapus user ini?")) {
                                                            destroy(`/user/${user.id}`)
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
                                    {search ? 'Tidak ada user yang ditemukan' : 'Belum ada user terdaftar'}
                                </TableCell>
                            </TableRow>
                        )}
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Tambah */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Tambah User</DialogTitle></DialogHeader>
                    <UserForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Simpan"
                        onCancel={() => setOpenAdd(false)}
                        roles={roles}
                        onSubmit={(e) => {
                            e.preventDefault()
                            post("/user", {
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
                    <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
                    <UserForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        submitLabel="Update"
                        isEdit
                        onCancel={() => setOpenEdit(false)}
                        roles={roles}
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!selectedUser) return
                            put(`/user/${selectedUser.id}`, {
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
                    <DialogHeader><DialogTitle>Detail User</DialogTitle></DialogHeader>
                    {selectedUser && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Nama</span>
                                <span>{selectedUser.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Email</span>
                                <span>{selectedUser.email}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-medium">Role</span>
                                <span className="capitalize">
                                    {selectedUser.roles && selectedUser.roles.length > 0
                                        ? formatRole(selectedUser.roles[0].id, roles)
                                        : formatRole(selectedUser.role_id, roles)}
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
