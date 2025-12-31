import { useState, useEffect } from 'react';
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import RoomCard from "./components/RoomCard";
import BookingModal from "./components/BookingModal";

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [rooms, setRooms] = useState([
    {
      id: 1, 
      name: "Studio Latihan A", 
      price: "150.000", 
      image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
      bookedSlots: [] 
    },
    
  ]);

  
  useEffect(() => {
    const updateJadwal = () => {
      const dataTerbaru = [
        {
          id: 1,
          bookedSlots: [
            { date: "2026-01-01", time: "10:00", status: "booked" },
            { date: "2026-01-01", time: "08:00", status: "used" }
          ]
        }
      ];
      setRooms(prevRooms => 
        prevRooms.map(room => {
          const update = dataTerbaru.find(d => d.id === room.id);
          return update ? { ...room, bookedSlots: update.bookedSlots } : room;
        })
      );
    };

    updateJadwal();
  }, []);

  //KITA COBA MELAKUKAN PERUBAHAN
  const openBooking = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <div className='min-h-screen bg-black text-white'>
      <Navbar />
      <Hero />
      <section className='py-20 px-6 max-w-7xl mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {rooms.map((room) => (
            <div key={room.id} onClick={() => openBooking(room)}> 
              <RoomCard {...room} />
            </div>
          ))}
        </div>
      </section>

      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;