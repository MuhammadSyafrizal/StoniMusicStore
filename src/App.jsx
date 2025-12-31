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
  
  // Kita ubah rooms jadi dinamis sepenuhnya dari Supabase (lebih aman & scalable)
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fungsi fetch rooms + bookings digabung supaya konsisten
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Ambil data rooms (misal dari tabel 'rooms')
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, price, image')
        .order('id');

      if (roomsError) throw roomsError;

      // 2. Ambil semua booking yang status booked atau pending
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('room_id, tanggal, jam, status')
        .in('status', ['booked', 'pending']);

      if (bookingsError) throw bookingsError;

      // 3. Gabungkan data: tambahkan bookedSlots ke setiap room
      const updatedRooms = (roomsData || []).map(room => ({
        ...room,
        price: room.price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0", // format harga
        image: room.image || "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
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
      // Fallback ke data statis kalau gagal
      setRooms([
        {
          id: 1,
          name: "Studio Latihan A",
          price: "150.000",
          image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
          bookedSlots: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Initial load

    // Realtime subscription
    const channel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Change detected:', payload);
          fetchData(); // Refresh semua data saat ada perubahan booking
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' }, // Opsional: kalau room bisa ditambah/edit
        () => fetchData()
      )
      .subscribe();

    // Cleanup saat component unmount
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
              {loading ? (
                <div className="text-center py-10">
                  <p>Loading studio tersedia...</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                  {rooms.length === 0 ? (
                    <p className="col-span-full text-center">Belum ada studio tersedia.</p>
                  ) : (
                    rooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => openBooking(room)}
                        className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
                      >
                        <RoomCard {...room} />
                      </div>
                    ))
                  )}
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