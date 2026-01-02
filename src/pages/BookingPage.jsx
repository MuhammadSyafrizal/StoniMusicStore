import { Calendar, Clock, Loader2, Phone, User, X, AlertCircle, Music, ShoppingCart } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

export default function BookingPage({ rooms = [], refreshData }) {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();
  const currentTime = useCurrentTime();

  const roomFromState = location.state?.room;
  const room = roomFromState || rooms.find((r) => r.id === parseInt(roomId));

  const [formData, setFormData] = useState({
    nama: "",
    whatsapp: "",
    tanggal: "",
    jamMulai: "",
    durasi: 2,
  });

  const [settings, setSettings] = useState({ jam_buka: "10:00", jam_tutup: "00:00" });
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  const DURASI_OPTIONS = [2, 3, 4, 5];

  // Logic useEffects dan Handler (Tetap sama)
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("studio_settings").select("jam_buka, jam_tutup").single();
      if (data) setSettings({ jam_buka: data.jam_buka || "10:00", jam_tutup: data.jam_tutup || "00:00" });
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!formData.tanggal) { setBookedSlots([]); return; }
    const fetchBooked = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from("bookings").select("jam, durasi_sewa").eq("tanggal", formData.tanggal).eq("room_id", room?.id).in("status", ["pending", "booked"]);
        const parsed = (data || []).map((b) => ({ jamMulai: b.jam.split(" - ")[0].trim(), durasi: b.durasi_sewa || 2 }));
        setBookedSlots(parsed);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchBooked();
  }, [formData.tanggal, room?.id]);

  const isSlotConflicting = (jamMulai, durasi) => {
    const start = parseInt(jamMulai.split(":")[0]);
    const end = start + durasi;
    return bookedSlots.some((b) => {
      const bStart = parseInt(b.jamMulai.split(":")[0]);
      const bEnd = bStart + b.durasi;
      return start < bEnd && end > bStart;
    });
  };

  const availableStarts = useMemo(() => {
    const buka = parseInt(settings.jam_buka.split(":")[0]);
    const tutup = settings.jam_tutup === "00:00" ? 24 : parseInt(settings.jam_tutup.split(":")[0]);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const jams = [];
    for (let h = buka; h <= tutup - formData.durasi; h++) {
      const jamStr = `${h.toString().padStart(2, "0")}:00`;
      if (formData.tanggal === todayStr) {
        const target = new Date(today);
        target.setHours(h, 0, 0, 0);
        if (currentTime.getTime() >= target.getTime()) continue;
      }
      if (!isSlotConflicting(jamStr, formData.durasi)) jams.push(jamStr);
    }
    return jams;
  }, [settings, formData.durasi, formData.tanggal, bookedSlots, currentTime]);

  const getDisplayEndTime = (jamMulai, durasi) => {
    const endHour = parseInt(jamMulai.split(":")[0]) + durasi;
    return `${(endHour > 24 ? endHour - 24 : endHour).toString().padStart(2, "0")}:00`;
  };

  const handleSubmit = async () => {
    if (!formData.nama || !formData.whatsapp || !formData.tanggal || !formData.jamMulai) {
      setWarning("Harap lengkapi semua field!"); return;
    }
    setLoading(true);
    const jamSelesaiDb = `${(parseInt(formData.jamMulai.split(":")[0]) + formData.durasi).toString().padStart(2, "0")}:00`;
    try {
      const { error } = await supabase.from("bookings").insert({
        nama: formData.nama.trim(), whatsapp: formData.whatsapp.trim(), tanggal: formData.tanggal,
        jam: `${formData.jamMulai} - ${jamSelesaiDb}`, status: "pending", room_id: room.id, durasi_sewa: formData.durasi,
      });
      if (error) throw error;
      window.open(`https://wa.me/6285886933826?text=${encodeURIComponent(`*BOOKING BARU*\nStudio: *${room.name}*\nNama: ${formData.nama}\nTanggal: ${formData.tanggal}\nJam: ${formData.jamMulai} - ${getDisplayEndTime(formData.jamMulai, formData.durasi)}`)}`, "_blank");
      if (refreshData) refreshData();
      navigate("/");
    } catch (err) { setWarning("Gagal melakukan booking."); } finally { setLoading(false); }
  };

  if (!room) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Studio Not Found</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* HEADER STONI MUSIC STORE */}
      

      {/* FORM CONTAINER - Dibuat Center */}
      <main className="flex-grow flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-zinc-800 relative">
            
            {/* Nama Studio Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              Booking {room.name}
            </div>

            <h2 className="text-3xl font-bold mb-8 text-center uppercase tracking-tighter italic">Form Booking</h2>

            {warning && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{warning}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Nama */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
                  <User size={14} /> Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
                  <Phone size={14} /> Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition"
                  placeholder="Contoh: 6281234567890"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Tanggal */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
                    <Calendar size={14} /> Tanggal
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value, jamMulai: "" })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                {/* Durasi */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
                    <Clock size={14} /> Durasi
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURASI_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setFormData({ ...formData, durasi: d, jamMulai: "" })}
                        className={`py-3 rounded-lg text-xs font-black transition ${
                          formData.durasi === d ? "bg-red-600 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {d}H
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Jam Mulai */}
              {formData.tanggal && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
                    <Clock size={14} /> Jam Mulai
                  </label>
                  {loading ? (
                    <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-red-500" /></div>
                  ) : availableStarts.length === 0 ? (
                    <p className="text-red-400 text-center text-xs font-bold">Tidak ada slot tersedia.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableStarts.map((jam) => (
                        <button
                          key={jam}
                          onClick={() => setFormData({ ...formData, jamMulai: jam })}
                          className={`py-2 rounded-lg text-xs font-medium transition ${
                            formData.jamMulai === jam ? "bg-red-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"
                          }`}
                        >
                          {jam}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ringkasan & Submit */}
              <div className="pt-4">
                {formData.jamMulai && (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4 text-center">
                    <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Total Sesi</p>
                    <p className="font-black text-red-500 uppercase italic">
                      {formData.tanggal} | {formData.jamMulai} - {getDisplayEndTime(formData.jamMulai, formData.durasi)}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.jamMulai}
                  className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-black uppercase tracking-widest transition flex items-center justify-center gap-3 shadow-lg shadow-red-600/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Booking Sekarang →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimalis agar tetap seimbang */}
      <footer className="py-6 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Stoni Music Store</p>
      </footer>
    </div>
  );
}