<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        $roleName = $user->role->name ?? null;

        // Pemilik & Super Admin -> akses semua
        if (in_array($roleName, ['pemilik', 'super admin'])) {
            return $next($request);
        }

        // Jika PJ -> perlakuan hampir sama dengan pemilik
        if ($roleName === 'penanggung jawab') {
            // Cek apakah route saat ini adalah "device"
            if ($request->routeIs('device.*')) {
                abort(403, 'Anda tidak punya akses ke halaman ini.');
            }

            return $next($request);
        }

        // Cek role lain sesuai yang diizinkan pada route
        if (in_array($roleName, $roles)) {
            return $next($request);
        }

        abort(403, 'Anda tidak punya akses ke halaman ini.');
    }
}
