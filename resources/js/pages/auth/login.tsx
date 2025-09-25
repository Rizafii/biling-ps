'use client';

import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
// import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Lock, Mail } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout title="" description="">
            <Head title="Masuk" />

            <Card className="rounded-2xl shadow-xl">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Selamat Datang</CardTitle>
                    <CardDescription>Masuk dengan email dan kata sandi Anda</CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="flex flex-col gap-2">
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-3">
                                    {/* Email */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Alamat Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="email@contoh.com"
                                                className="pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Password */}
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Kata Sandi</Label>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Kata sandi"
                                                className="pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center space-x-3">
                                        <Checkbox id="remember" name="remember" tabIndex={3} />
                                        <Label htmlFor="remember" className="text-sm">
                                            Ingat saya
                                        </Label>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-xl font-medium shadow-md transition-all hover:shadow-lg"
                                        tabIndex={4}
                                        disabled={processing}
                                    >
                                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                        Masuk
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>

                    {/* Status Message */}
                    {status && <div className="mt-4 rounded-lg bg-green-100 px-4 py-2 text-center text-sm font-medium text-green-700">{status}</div>}
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
