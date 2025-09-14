"use client";

import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Mail, Lock, User } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    return (
        <AuthLayout
            title=""
            description=""
        >
            <Head title="Daftar" />

                <Card className="shadow-xl rounded-2xl">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Buat Akun Anda
                        </CardTitle>
                        <CardDescription>
                            Lengkapi data di bawah untuk mulai menggunakan aplikasi
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Form
                            {...RegisteredUserController.store.form()}
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            className="flex flex-col gap-2"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-3">
                                        {/* Nama */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Nama Lengkap</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="name"
                                                    name="name"
                                                    placeholder="Masukkan nama lengkap"
                                                    className="pl-9"
                                                />
                                            </div>
                                            <InputError message={errors.name} className="mt-1" />
                                        </div>

                                        {/* Email */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Alamat Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    name="email"
                                                    placeholder="email@contoh.com"
                                                    className="pl-9"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* Password */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Kata Sandi</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    required
                                                    tabIndex={3}
                                                    autoComplete="new-password"
                                                    name="password"
                                                    placeholder="Masukkan kata sandi"
                                                    className="pl-9"
                                                />
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* Konfirmasi Password */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">
                                                Konfirmasi Kata Sandi
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="password_confirmation"
                                                    type="password"
                                                    required
                                                    tabIndex={4}
                                                    autoComplete="new-password"
                                                    name="password_confirmation"
                                                    placeholder="Ulangi kata sandi"
                                                    className="pl-9"
                                                />
                                            </div>
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        {/* Tombol Submit */}
                                        <Button
                                            type="submit"
                                            className="w-full h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                                            tabIndex={5}
                                            disabled={processing}
                                        >
                                            {processing && (
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Buat Akun
                                        </Button>
                                    </div>

                                    {/* Link ke Login */}
                                    <div className="text-center text-sm text-muted-foreground mt-4">
                                        Sudah punya akun?{' '}
                                        <TextLink href={login()} tabIndex={6}>
                                            Masuk
                                        </TextLink>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
        </AuthLayout>
    );
}
