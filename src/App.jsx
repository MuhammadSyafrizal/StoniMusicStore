import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from "react-router-dom"; // Tambahkan useNavigate
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AdminWangsa from './pages/AdminWangsa';
import AdminLogin from './pages/AdminLogin';
import { supabase } from "./lib/supabase";
import EquipmentPage from './components/EquipmentPage';
import BookingPage from './pages/BookingPage';
import StudioGallery from './components/StudioGallery';

function App() {
  const navigate = useNavigate(); // Untuk navigasi ke booking page

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, price, image, description')
        .order('id');

      if (roomsError) throw roomsError;

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('room_id, tanggal, jam, status')
        .in('status', ['booked', 'pending']);

      if (bookingsError) throw bookingsError;

      const updatedRooms = (roomsData || []).map(room => ({
        ...room,
        price: room.price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0",
        image: room.image || "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
        description: room.description || "Studio serbaguna dengan fasilitas lengkap.",
        bookedSlots: (bookingsData || [])
          .filter(b => Number(b.room_id) === Number(room.id))
          .map(b => ({
            date: b.tanggal,
            time: b.jam,
            status: b.status
          }))
      }));

      setRooms(updatedRooms);
    } catch (err) {
      console.error("Error fetching data:", err);

      // Fallback data jika Supabase gagal (opsional, bisa diperluas)
      setRooms([
        {
          id: 1,
          name: "Studio Latihan A",
          price: "150.000",
          image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
          description: "Cocok untuk latihan band pemula.",
        },
        {
          id: 2,
          name: "Studio Latihan B",
          price: "175.000",
          image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
          description: "Ruang premium dengan ampli Marshall.",
        },
        // Tambahkan fallback lainnya sesuai kebutuhan
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data saat mount + realtime subscription
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Fungsi untuk membuka halaman booking dengan data room
  const handleBookRoom = (room) => {
    navigate(`/booking/${room.id}`, { state: { room } });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <Routes>
        {/* HALAMAN UTAMA */}
        <Route
          path="/"
          element={
            <>
              <Hero />

              {loading ? (
                <div className="text-center py-40">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600 mx-auto mb-6"></div>
                  <p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">
                    Loading Spaces...
                  </p>
                </div>
              ) : (
                <StudioGallery rooms={rooms} onBookRoom={handleBookRoom} />
              )}
            </>
          }
        />

        {/* HALAMAN BOOKING */}
        <Route
          path="/booking/1"
          element={<BookingPage rooms={rooms} refreshData={fetchData} />}
        />

        {/* HALAMAN LAIN */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/admin-wangsa-rahasia" element={<AdminWangsa />} />
      </Routes>
    </div>
  );
}

export default App; // hapus bagian setRooms, lalu ganti dengan tampilan studiogallery.jsx