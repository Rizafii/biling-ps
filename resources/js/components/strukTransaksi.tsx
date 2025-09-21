interface Billing {
  nama_pelanggan: string;
  no_port: string;
  mode: 'bebas' | 'timer';
  durasi: string; // "HH:MM:SS"
  tarif_perjam: number;
  total: number;       // total sebelum promo
  net_total: number;   // harga bersih setelah promo
  promo?: { type: string; label: string; value: number };
  waktu_mulai: string;
  waktu_selesai: string;
}

const StrukTransaksi = ({ billing }: { billing: Billing }) => {
  return (
    <div className="max-w-sm mx-auto bg-white shadow-lg rounded-lg p-6 font-mono">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">STRUK PEMBAYARAN</h1>
        <p className="text-sm text-gray-500">Co-working / Warnet / Port Listrik</p>
      </div>

      {/* Info Pelanggan */}
      <div className="mb-4 border-b pb-2">
        <p><span className="font-semibold">Nama Pelanggan:</span> {billing.nama_pelanggan}</p>
        <p><span className="font-semibold">Port:</span> {billing.no_port}</p>
        <p><span className="font-semibold">Mode:</span> {billing.mode}</p>
      </div>

      {/* Waktu */}
      <div className="mb-4 border-b pb-2">
        <p><span className="font-semibold">Waktu Mulai:</span> {billing.waktu_mulai}</p>
        <p><span className="font-semibold">Waktu Selesai:</span> {billing.waktu_selesai}</p>
        <p><span className="font-semibold">Durasi:</span> {billing.durasi}</p>
      </div>

      {/* Tarif & Promo */}
      <div className="mb-4 border-b pb-2">
        <p><span className="font-semibold">Tarif per Jam:</span> Rp {billing.tarif_perjam.toLocaleString('id-ID')}</p>
        <p><span className="font-semibold">Total:</span> Rp {billing.total.toLocaleString('id-ID')}</p>
        {billing.promo && (
          <p>
            <span className="font-semibold">Promo ({billing.promo.label}):</span> -{billing.promo.value}{billing.promo.type === 'percent' ? '%' : 'Rp'}
          </p>
        )}
      </div>

      {/* Harga Bersih */}
      <div className="text-right mt-4">
        <p className="text-lg font-bold">
          <span className="mr-2">Harga Bersih:</span> Rp {billing.net_total.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Terima kasih atas pembayaran Anda
      </div>
    </div>
  );
};

