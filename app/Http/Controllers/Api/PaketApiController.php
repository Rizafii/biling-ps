<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaketApiController extends Controller
{
    public function index(): JsonResponse
    {
        $paket = Paket::select('id', 'name', 'harga', 'duration')->get();

        return response()->json([
            'success' => true,
            'paket' => $paket
        ]);
    }
}
