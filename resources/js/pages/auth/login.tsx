"use client";

import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Mail, Lock } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout
            title=""
            description=""
        >
            <Head title="Masuk" />

            <Card className=" shadow-xl rounded-2xl">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Selamat Datang
                    </CardTitle>
                    <CardDescription>
                        Masuk dengan email dan kata sandi Anda
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Form
                        {...AuthenticatedSessionController.store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-2"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-3">
                                    {/* Email */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Alamat Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="ml-auto text-sm"
                                                    tabIndex={5}
                                                >
                                                    Lupa kata sandi?
                                                </TextLink>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                                        className="w-full h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                                        tabIndex={4}
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Masuk
                                    </Button>
                                </div>

                                {/* Link ke Register */}
                                <div className="text-center text-sm text-muted-foreground mt-4">
                                    Belum punya akun?{' '}
                                    <TextLink href={register()} tabIndex={5}>
                                        Daftar
                                    </TextLink>
                                </div>
                            </>
                        )}
                    </Form>

                    {/* Status Message */}
                    {status && (
                        <div className="mt-4 rounded-lg bg-green-100 text-green-700 px-4 py-2 text-center text-sm font-medium">
                            {status}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
