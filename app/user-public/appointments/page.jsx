"use client";
import { Calendar, Clock, User } from "lucide-react";
import Sidebar from "../Sidebar";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

const BASE_URL = "http://localhost:5000";

export default function AppointmentsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Fetch user info and their appointments
  useEffect(() => {
    const token = localStorage.getItem("publicToken");
    const userName = localStorage.getItem("full_name");

    if (!token || !userName) {
      router.push("/user-public/login");
      return;
    }

    setPatientName(userName);
    setLoadingAppointments(true);

    fetch(`${BASE_URL}/api/appointments?user=${encodeURIComponent(userName)}`)
      .then(res => res.json())
      .then(data => {
        let appts = [];
        if (data && data.success && Array.isArray(data.data)) {
          appts = data.data;
        }
        setAppointments(appts);
      })
      .catch((err) => {
        console.error('Error fetching appointments:', err);
        setAppointments([]);
      })
      .finally(() => setLoadingAppointments(false));
  }, [router]);

  const handleCancel = async (id) => {
    await fetch(`${BASE_URL}/api/appointments/${id}`, { method: "DELETE" });
    setAppointments(prev => prev.filter(item => item.id !== id));
  };

  // Fetch doctors/counselors when type changes
  useEffect(() => {
    if (!type) {
      setDoctorList([]);
      return;
    }
    setLoadingDoctors(true);
    const endpoint = type === 'Counselor' ? `${BASE_URL}/api/counselors` : `${BASE_URL}/api/psychiatrists`;
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setDoctorList(data.data);
        } else {
          setDoctorList([]);
        }
        setSelectedDoctor("");
      })
      .catch(() => setDoctorList([]))
      .finally(() => setLoadingDoctors(false));
  }, [type]);

  useEffect(() => {
    console.log('Appointments state after fetch:', appointments);
  }, [appointments]);

  function validate() {
    const errs = {};
    if (!type) errs.type = "Type is required";
    if (!patientName) errs.patientName = "Patient name is required";
    if (!selectedDoctor) errs.selectedDoctor = "Please select a doctor/counselor";
    if (!date) errs.date = "Date is required";
    if (!time) errs.time = "Time is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const appointmentData = {
      role: type,
      name_patient: patientName,
      assigned_to: selectedDoctor,
      status: 'In Progress', // Keep status consistent
      date_time: `${date}T${time}:00` // Ensure ISO 8601 format for backend
    };

    try {
      let res;
      if (editingAppointment) {
        // Update existing appointment
        res = await fetch(`${BASE_URL}/api/appointments/${editingAppointment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointmentData)
        });
      } else {
        // Create new appointment
        res = await fetch(`${BASE_URL}/api/appointments/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointmentData)
        });
      }

      const data = await res.json();
      if (res.ok) {
        alert(`Appointment ${editingAppointment ? 'updated' : 'booked'} successfully!`);
        setShowModal(false);
        setEditingAppointment(null); // Reset editing state
        // Manually update the UI to reflect changes
        if (editingAppointment) {
          setAppointments(prev => prev.map(appt =>
            appt.id === editingAppointment.id ? { ...appt, ...appointmentData, date_time: `${date} ${time}` } : appt
          ));
        } else {
           // This part needs a proper refresh logic, for now, we can just close the modal
        }
      } else {
        console.error(data.error);
        alert(`Failed to ${editingAppointment ? 'update' : 'book'} appointment.`);
      }
    } catch (err) {
      console.error('Request error:', err);
      alert('Server error.');
    }
  }

  function handleRescheduleClick(appointment) {
    setEditingAppointment(appointment);
    const [datePart, timePart] = appointment.date_time.split(' ');
    setType(appointment.role);
    setSelectedDoctor(appointment.assigned_to);
    setDate(datePart);
    setTime(timePart);
    setShowModal(true);
  }

  function handleAddNewClick() {
    setEditingAppointment(null);
    setType('');
    setSelectedDoctor('');
    setDate('');
    setTime('');
    setShowModal(true);
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activePage="APPOINTMENTS" />
      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition text-base"
            onClick={handleAddNewClick}
          >
            Schedule New Appointment
          </button>
        </div>
        {/* Modal for New/Edit Appointment */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                onClick={() => {
                  setShowModal(false);
                  setEditingAppointment(null);
                }}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{editingAppointment ? "Reschedule Appointment" : "Schedule Appointment"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type of Appointment */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Type of Appointment</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={type}
                    onChange={e => setType(e.target.value)}
                    required
                  >
                    <option value="">Select type...</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                  </select>
                  {errors.type && <div className="text-red-500 text-xs mt-1">{errors.type}</div>}
                </div>
                {/* Patient Name */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-gray-700"
                    value={patientName}
                    readOnly
                  />
                  {errors.patientName && <div className="text-red-500 text-xs mt-1">{errors.patientName}</div>}
                </div>
                {/* Select Doctor/Counselor */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select {type || "Doctor/Counselor"}</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                    required
                    disabled={!type || loadingDoctors}
                  >
                    <option value="">{loadingDoctors ? "Loading..." : `Select ${type || "Doctor/Counselor"}`}</option>
                    {doctorList.length > 0 ? (
                      doctorList.map(doc => (
                        <option key={doc.id} value={doc.full_name}>{doc.full_name}</option>
                      ))
                    ) : (
                      <option value="" disabled>{type ? `No ${type}s found` : ''}</option>
                    )}
                  </select>
                  {errors.selectedDoctor && <div className="text-red-500 text-xs mt-1">{errors.selectedDoctor}</div>}
                </div>
                {/* Appointment Date */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                  {errors.date && <div className="text-red-500 text-xs mt-1">{errors.date}</div>}
                </div>
                {/* Appointment Time */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Appointment Time</label>
                  <input
                    type="time"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                  />
                  {errors.time && <div className="text-red-500 text-xs mt-1">{errors.time}</div>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition mt-2"
                >
                  {editingAppointment ? 'Update Appointment' : 'Book Appointment'}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Upcoming Appointments Table */}
        <section className="bg-white rounded-2xl shadow p-6 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-500" size={22} />
            <span className="font-semibold text-gray-800 text-lg">Upcoming Appointments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-gray-500 text-sm border-b">
                  <th className="py-2 px-4 font-semibold">Date</th>
                  <th className="py-2 px-4 font-semibold">Time</th>
                  <th className="py-2 px-4 font-semibold">Counselor/Psychiatrist</th>
                  <th className="py-2 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingAppointments ? (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-400">Loading...</td></tr>
                ) : !appointments || appointments.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-400">No appointments found.</td></tr>
                ) : (
                  appointments.map((item) => {
                    // Split date_time string from backend "YYYY-MM-DD HH:MM:SS"
                    const [datePart, timePart] = item.date_time ? item.date_time.split(' ') : ['', ''];
                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 px-4 font-semibold text-gray-800 whitespace-nowrap">{datePart}</td>
                        <td className="py-2 px-4 text-gray-700 whitespace-nowrap">{timePart}</td>
                        <td className="py-2 px-4 text-gray-700 whitespace-nowrap">{item.assigned_to} ({item.role})</td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          <button className="text-blue-600 hover:underline font-medium mr-4" onClick={() => handleRescheduleClick(item)}>Reschedule</button>
                          <button className="text-red-500 hover:underline font-medium" onClick={() => handleCancel(item.id)}>Cancel</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Schedule Appointment */}
          <div className="bg-blue-50 rounded-2xl shadow p-6 flex flex-col items-center text-center">
            <div className="bg-white rounded-full p-3 mb-3 shadow">
              <Calendar className="text-blue-500" size={32} />
            </div>
            <div className="font-bold text-lg text-blue-900 mb-1">Schedule Appointment</div>
            <div className="text-gray-600 mb-4">Book a session with your preferred counselor</div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition" onClick={handleAddNewClick}>Book Now</button>
          </div>
          {/* Emergency Session */}
          <div className="bg-green-50 rounded-2xl shadow p-6 flex flex-col items-center text-center">
            <div className="bg-white rounded-full p-3 mb-3 shadow">
              <Clock className="text-green-500" size={32} />
            </div>
            <div className="font-bold text-lg text-green-900 mb-1">Emergency Session</div>
            <div className="text-gray-600 mb-4">Need immediate support? Book an urgent session</div>
            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition" onClick={() => router.push('/user-public/emergency-case')}>Emergency</button>
          </div>
          {/* Find Counselor */}
          <div className="bg-purple-50 rounded-2xl shadow p-6 flex flex-col items-center text-center">
            <div className="bg-white rounded-full p-3 mb-3 shadow">
              <User className="text-purple-500" size={32} />
            </div>
            <div className="font-bold text-lg text-purple-900 mb-1">Find Counselor & Psychiatrist</div>
            <div className="text-gray-600 mb-4">Browse and connect with available counselors and psychiatrists</div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition" onClick={() => router.push('/user-public/self-assessment/find-location')}>Browse</button>
          </div>
        </div>
      </main>
    </div>
  );
} 