import { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import RoomCard from "./components/RoomCard";
import AdminWangsa from './pages/AdminWangsa';
import BookingModal from "./components/BookingModal";
import { supabase } from "./lib/supabase";

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, price, image, description') // Tambah field description jika ada di DB
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
        description: room.description || getFallbackDescription(room.id), // Gunakan deskripsi dari DB atau fallback
        bookedSlots: (bookingsData || [])
          .filter(b => Number(b.room_id) === Number(room.id))
          .filter(b => b.status === "pending" || b.status === "booked")
          .map(b => ({
            date: b.tanggal,
            time: b.jam,
            status: b.status
          }))
      }));

      setRooms(updatedRooms);
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback statis dengan deskripsi
      setRooms([
        {
          id: 1,
          name: "Studio Latihan A",
          price: "150.000",
          image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
          description: "Cocok untuk latihan band pemula. Dilengkapi drum, amplifier gitar/bass, dan keyboard standar.",
          bookedSlots: []
        },
        {
          id: 2,
          name: "Studio Latihan B",
          price: "175.000",
          image: "/src/assets/StudioB.webp",
          description: "Ruang lebih luas dengan perlengkapan premium: Ampli Marshall, drum Pearl, dan sistem monitoring yang jernih.",
          bookedSlots: []
        },
        {
          id: 3,
          name: "Studio Rekaman Pro",
          price: "250.000",
          image: "/src/assets/StudioC.webp",
          description: "Studio rekaman profesional dengan control room terpisah, mic condenser high-end, dan akustik ruangan optimal.",
          bookedSlots: []
        },
        {
          id: 4,
          name: "Studio Dance & Vocal",
          price: "200.000",
          image: "/src/assets/StudioD.webp",
          description: "Ruang luas dengan lantai kayu, cermin full wall, sound system karaoke, dan booth vocal untuk latihan vokal/dance.",
          bookedSlots: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

// Helper untuk fallback description kalau DB belum punya field description
const getFallbackDescription = (id) => {
  const desc = {
    1: "Cocok untuk latihan band pemula. Dilengkapi drum, amplifier gitar/bass, dan keyboard standar.",
    2: "Ruang lebih luas dengan perlengkapan premium: Ampli Marshall, drum Pearl, dan sistem monitoring yang jernih.",
    3: "Studio rekaman profesional dengan control room terpisah, mic condenser high-end, dan akustik ruangan optimal.",
    4: "Ruang luas dengan lantai kayu, cermin full wall, sound system karaoke, dan booth vocal untuk latihan vokal/dance."
  };
  return desc[id] || "Studio serbaguna dengan fasilitas lengkap.";
};

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

  const openBooking = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <div className='min-h-screen bg-black text-white'>
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <section className='py-20 px-6 max-w-7xl mx-auto'>
              <h2 className='text-4xl font-bold text-center mb-16'>
                Pilih Studio Anda
              </h2>

              {loading ? (
                <div className="text-center py-20">
                  <p className="text-xl">Memuat studio tersedia...</p>
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-center text-xl">Belum ada studio tersedia.</p>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10'>
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => openBooking(room)}
                      className="cursor-pointer transform hover:scale-105 transition-all duration-300 hover:z-10"
                    >
                      <RoomCard {...room} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        } />
        <Route path="/admin-wangsa-rahasia" element={<AdminWangsa />} />
      </Routes>

      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRoom(null);
          }}
          refreshData={fetchData}
        />
      )}
    </div>
  );
}

export default App;