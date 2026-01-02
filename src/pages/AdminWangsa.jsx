import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminWangsa() {
  const [bookings, setBookings] = useState([]);
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [settings, setSettings] = useState({
    jam_buka: "10:00",
    jam_tutup: "00:00",
    durasi_sewa: 2,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Ambil booking aktif + durasi_sewa
      const { data: activeData, error: activeError } = await supabase
        .from('bookings')
        .select('id, nama, whatsapp, tanggal, jam, status, created_at, room_id, durasi_sewa')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;
      setBookings(activeData || []);

      // Ambil riwayat cancelled
      const { data: cancelledData, error: cancelledError } = await supabase
        .from('cancelled_bookings')
        .select('id, nama, whatsapp, tanggal, jam, created_at, room_id, cancelled_at')
        .order('cancelled_at', { ascending: false });

      if (cancelledError && cancelledError.code !== 'PGRST116') throw cancelledError;
      setCancelledBookings(cancelledData || []);

      // Ambil pengaturan jam
      const { data: settingsData, error: settingsError } = await supabase
        .from('studio_settings')
        .select('jam_buka, jam_tutup, durasi_sewa')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') console.error(settingsError);

      if (settingsData) {
        setSettings({
          jam_buka: settingsData.jam_buka || "10:00",
          jam_tutup: settingsData.jam_tutup || "00:00",
          durasi_sewa: settingsData.durasi_sewa || 2,
        });
      }
    } catch (err) {
      console.error("Error memuat data:", err);
      alert("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cancelled_bookings' }, () => fetchData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const handleConfirm = async (id) => {
    if (!confirm("Yakin ingin mengkonfirmasi & lock jadwal ini?")) return;

    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'booked' } : b));

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'booked' })
      .eq('id', id);

    if (error) {
      alert("Gagal konfirmasi: " + error.message);
      fetchData();
    } else {
      alert("✅ Jadwal berhasil di-lock permanen!");
    }
  };

  const handleCancel = async (id, nama, tanggal, jam) => {
    const konfirmasi = `Yakin ingin MEMBATALKAN booking ini?\n\nNama: ${nama}\nTanggal: ${tanggal}\nJam: ${jam}\n\nSlot akan langsung tersedia lagi untuk customer.\nRiwayat pembatalan akan disimpan permanen di arsip.`;

    if (!confirm(konfirmasi)) return;

    const bookingToCancel = bookings.find(b => b.id === id);

    setBookings(prev => prev.filter(b => b.id !== id));

    const { error: archiveError } = await supabase
      .from('cancelled_bookings')
      .insert({
        nama: bookingToCancel.nama,
        whatsapp: bookingToCancel.whatsapp,
        tanggal: bookingToCancel.tanggal,
        jam: bookingToCancel.jam,
        room_id: bookingToCancel.room_id,
      });

    if (archiveError) {
      alert("Gagal menyimpan riwayat pembatalan: " + archiveError.message);
      fetchData();
      return;
    }

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      alert("Gagal menghapus booking: " + deleteError.message);
      fetchData();
    } else {
      alert(`❌ Booking "${nama}" berhasil dibatalkan!\nSlot sudah tersedia lagi & riwayat tersimpan di arsip.`);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('studio_settings')
        .upsert({
          id: 1,
          jam_buka: settings.jam_buka,
          jam_tutup: settings.jam_tutup,
          durasi_sewa: parseInt(settings.durasi_sewa),
        });

      if (error) throw error;
      alert("✅ Pengaturan jam berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTanggal = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getJamSelesai = (jamMulai, durasi) => {
    const [hour] = jamMulai.split(':').map(Number);
    const selesai = hour + durasi;
    return `${selesai.toString().padStart(2, '0')}:00`;
  };

  // Filter booking berdasarkan search
  const filteredBookings = bookings.filter(b =>
    b.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.whatsapp.includes(searchTerm) ||
    b.tanggal.includes(searchTerm)
  );

  // Hitung booking hari ini
  const today = new Date().toISOString().split('T')[0];
  const todayBookingsCount = bookings.filter(b => b.tanggal === today).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Sedang memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Panel Admin Wangsa Studio</h1>
        <p className="text-zinc-400 mb-10">Kelola booking, pengaturan jam, dan riwayat pembatalan</p>

        {/* STATISTIK HARI INI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-center">
            <p className="text-zinc-400 text-sm">Total Booking Aktif</p>
            <p className="text-4xl font-bold text-white mt-2">{bookings.length}</p>
          </div>
          <div className="bg-red-900/30 border border-red-800/50 rounded-3xl p-6 text-center">
            <p className="text-zinc-400 text-sm">Booking Hari Ini</p>
            <p className="text-4xl font-bold text-red-400 mt-2">{todayBookingsCount}</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-center">
            <p className="text-zinc-400 text-sm">Riwayat Dibatalkan</p>
            <p className="text-4xl font-bold text-zinc-500 mt-2">{cancelledBookings.length}</p>
          </div>
        </div>

        {/* PENGATURAN JAM */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-red-400">Pengaturan Jam Operasional</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Jam Buka</label>
              <input
                type="time"
                value={settings.jam_buka}
                onChange={(e) => setSettings({ ...settings, jam_buka: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-4 text-white focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Jam Tutup</label>
              <input
                type="time"
                value={settings.jam_tutup}
                onChange={(e) => setSettings({ ...settings, jam_tutup: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-4 text-white focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Durasi Minimal Sewa</label>
              <select
                value={settings.durasi_sewa}
                onChange={(e) => setSettings({ ...settings, durasi_sewa: parseInt(e.target.value) })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-4 text-white focus:border-red-500"
              >
                <option value="2">2 Jam</option>
                <option value="3">3 Jam</option>
                <option value="4">4 Jam</option>
                <option value="5">5 Jam</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-10 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-bold text-xl shadow-xl disabled:opacity-70"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>

        {/* BOOKING AKTIF */}
        <h2 className="text-2xl font-bold mb-6">Booking Aktif</h2>
        <input
          type="text"
          placeholder="🔍 Cari nama, nomor WA, atau tanggal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 mb-6 bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-4 text-white placeholder-zinc-500 focus:border-red-500"
        />

        {filteredBookings.length === 0 ? (
          <p className="text-zinc-500 mb-12">Tidak ada booking yang sesuai dengan pencarian.</p>
        ) : (
          <div className="grid gap-6 mb-12">
            {filteredBookings.map((b) => {
              const durasi = b.durasi_sewa || settings.durasi_sewa || 2;
              const jamSelesai = getJamSelesai(b.jam, durasi);

              return (
                <div
                  key={b.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                >
                  <div className="flex-1">
                    <p className="font-bold text-2xl text-red-400">{b.nama}</p>
                    <p className="text-zinc-300 mt-2 text-lg">
                      <span className="font-semibold">Studio ID {b.room_id}</span> • {b.tanggal}
                    </p>
                    <p className="text-zinc-300 text-lg">
                      ⏰ {b.jam} WIB ({durasi} jam)
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">
                      WA: <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{b.whatsapp}</a>
                    </p>
                    <p className="text-xs text-zinc-600 mt-3">Masuk: {formatTanggal(b.created_at)}</p>
                    <div className="mt-5">
                      {b.status === 'pending' ? (
                        <span className="px-5 py-2 bg-yellow-900/50 text-yellow-300 rounded-full text-sm font-bold border border-yellow-700 animate-pulse">
                          Menunggu Konfirmasi DP
                        </span>
                      ) : (
                        <span className="px-5 py-2 bg-green-900/50 text-green-300 rounded-full text-sm font-bold border border-green-700">
                          Sudah Dikonfirmasi & Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 flex-wrap justify-end">
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(b.id)}
                          className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-500 hover:text-white shadow-md"
                        >
                          ✓ Konfirmasi DP
                        </button>
                        <button
                          onClick={() => handleCancel(b.id, b.nama, b.tanggal, b.jam)}
                          className="bg-zinc-800 text-zinc-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white shadow-md"
                        >
                          ✕ Batalkan
                        </button>
                      </>
                    )}
                    {b.status === 'booked' && (
                      <button
                        onClick={() => handleCancel(b.id, b.nama, b.tanggal, b.jam)}
                        className="bg-red-900/70 text-red-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white shadow-md border border-red-800"
                      >
                        ✕ Batalkan (Sudah DP)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RIWAYAT PEMBATALAN */}
        {cancelledBookings.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-red-400">Riwayat Pembatalan</h2>
            <div className="grid gap-6">
              {cancelledBookings.map((c) => (
                <div key={c.id} className="bg-red-900/20 border border-red-900/50 rounded-3xl p-6 opacity-80">
                  <p className="font-bold text-xl text-red-300">[DIBATALKAN] {c.nama}</p>
                  <p className="text-zinc-400 mt-2">
                    Studio ID {c.room_id} • {c.tanggal} jam {c.jam}
                  </p>
                  <p className="text-sm text-zinc-500 mt-2">WA: {c.whatsapp}</p>
                  <p className="text-xs text-zinc-600 mt-3">
                    Dibatalkan pada: {formatTanggal(c.cancelled_at || c.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}