'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Port {
    id: string;
    device: string;
    device_name?: string;
    no_port: string;
    nama_port: string;
    pin?: number;
    type: string;
    nama_pelanggan: string;
    duration: string;
    price: string;
    status: 'idle' | 'on' | 'off';
    time: number;
    total: number;
    billing: number;
    subtotal: number;
    diskon: number;
    promoList: { id: string; label: string }[];
    mode: 'timed' | 'bebas';
    hours: string;
    minutes: string;
    promoScheme: string;
    device_status?: 'online' | 'offline';
    last_heartbeat?: string;
    server_time?: number;
    start_time?: number;
}

interface ModalEditPortProps {
    isOpen: boolean;
    onClose: () => void;
    port: Port;
    onUpdatePort: (updatedPort: Port) => void;
}

export default function ModalEditPort({ isOpen, onClose, port, onUpdatePort }: ModalEditPortProps) {
    const [namaPort, setNamaPort] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (port) {
            setNamaPort(port.nama_port);
            setError('');
        }
    }, [port]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/relay/update-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    device_id: port.device,
                    pin: port.pin,
                    nama_relay: namaPort.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Update port data locally
                const updatedPort = {
                    ...port,
                    nama_port: namaPort.trim(),
                };
                onUpdatePort(updatedPort);
                onClose();
            } else {
                setError(result.message || 'Gagal mengupdate nama port');
            }
        } catch (error) {
            console.error('Error updating port name:', error);
            setError('Terjadi kesalahan saat mengupdate nama port');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNamaPort(port?.nama_port || '');
        setError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Nama Port</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="device">Device</Label>
                        <Input id="device" value={port?.device || ''} disabled className="bg-gray-50" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="port-number">Nomor Port</Label>
                        <Input id="port-number" value={port?.no_port || ''} disabled className="bg-gray-50" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nama-port">Nama Port</Label>
                        <Input
                            id="nama-port"
                            value={namaPort}
                            onChange={(e) => setNamaPort(e.target.value)}
                            placeholder="Masukkan nama port..."
                            required
                            maxLength={255}
                            disabled={isLoading}
                        />
                    </div>

                    {error && <div className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isLoading || !namaPort.trim()}>
                            {isLoading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
