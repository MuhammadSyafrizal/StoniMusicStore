import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminWangsa() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, nama, whatsapp, tanggal, jam, status, created_at, room_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error Supabase:", err);
      alert("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          console.log('Ada perubahan booking! Refresh data...');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'pending' } : b));
    } else {
      alert("✅ Jadwal berhasil di-lock permanen!");
    }
  };

  const handleCancel = async (id, nama, tanggal, jam) => {
    const konfirmasi = `Yakin ingin MEMBATALKAN booking ini?\n\nNama: ${nama}\nTanggal: ${tanggal}\nJam: ${jam}\n\nSlot ini akan langsung tersedia lagi untuk customer lain.`;

    if (!confirm(konfirmasi)) return;

    setBookings(prev => prev.filter(b => b.id !== id));

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Gagal membatalkan: " + error.message);
      fetchData();
    } else {
      alert(`❌ Booking "${nama}" berhasil dibatalkan!\nSlot ${tanggal} jam ${jam} sudah tersedia lagi.`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Sedang memuat data booking...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Panel Admin Wangsa Studio</h1>
        <p className="text-zinc-400 mb-8">Konfirmasi pembayaran atau batalkan booking</p>

        {bookings.length === 0 ? (
          <div className="p-16 border-2 border-dashed border-zinc-800 rounded-3xl text-center">
            <p className="text-zinc-500 text-lg">Belum ada booking masuk.</p>
            <p className="text-zinc-600 text-sm mt-2">Tunggu customer booking via website ya! 🎸</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
              >
                <div className="flex-1">
                  <p className="font-bold text-2xl text-red-400">{b.nama}</p>
                  <p className="text-zinc-300 mt-2 text-lg">
                    <span className="font-semibold">Studio ID {b.room_id}</span> • {b.tanggal} jam {b.jam}
                  </p>
                  <p className="text-sm text-zinc-500 mt-2">
                    WA: <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{b.whatsapp}</a>
                  </p>
                  <p className="text-xs text-zinc-600 mt-3">
                    Masuk pada: {formatTanggal(b.created_at)}
                  </p>

                  {/* BADGE STATUS DIKECILKAN */}
                  <div className="mt-5">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === 'booked'
                        ? 'bg-green-600/30 text-green-400 border border-green-600'
                        : 'bg-yellow-600/30 text-yellow-400 border border-yellow-600 animate-pulse'
                    }`}>
                      {b.status === 'booked' ? 'Sudah Dikonfirmasi & Locked' : 'Menunggu Konfirmasi DP'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {b.status === 'pending' && (
                    <button
                      onClick={() => handleConfirm(b.id)}
                      className="bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-500 hover:text-white transition-all shadow-md"
                    >
                      ✓ Konfirmasi DP
                    </button>
                  )}

                  <button
                    onClick={() => handleCancel(b.id, b.nama, b.tanggal, b.jam)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                      b.status === 'booked'
                        ? 'bg-red-900/70 text-red-300 hover:bg-red-600 hover:text-white border border-red-800'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-red-600 hover:text-white'
                    }`}
                  >
                    ✕ {b.status === 'booked' ? 'Batalkan Booking' : 'Batalkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}