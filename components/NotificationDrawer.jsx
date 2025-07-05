import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

const dummyNotifications = [
  { id: 1, message: 'New appointment booked', time: '2 min ago' },
  { id: 2, message: 'Emergency case received', time: '10 min ago' },
  { id: 3, message: 'Feedback submitted', time: '30 min ago' },
  { id: 4, message: 'Material updated', time: '1 hr ago' },
  { id: 5, message: 'New user registered', time: '2 hr ago' },
  { id: 6, message: 'NGO activity reported', time: '3 hr ago' },
  { id: 7, message: 'Referral request received', time: '5 hr ago' },
];

export default function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Show notifications"
      >
        <Bell size={24} className="text-gray-700" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-fade-in">
          <div className="p-4 border-b font-semibold text-gray-800">Notifications</div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {dummyNotifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No notifications</div>
            ) : (
              dummyNotifications.map((notif) => (
                <div key={notif.id} className="p-4 hover:bg-blue-50 transition flex flex-col">
                  <span className="text-gray-700">{notif.message}</span>
                  <span className="text-xs text-gray-400 mt-1">{notif.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 