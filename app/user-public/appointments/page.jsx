"use client";
import { Calendar, Clock, User, Menu, X } from "lucide-react";
import Sidebar from "../Sidebar";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

const BASE_URL = "";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDoctorInfo, setSelectedDoctorInfo] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [originalDateTime, setOriginalDateTime] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [originalDate, setOriginalDate] = useState('');
  const [originalTime, setOriginalTime] = useState('');
  const [originalCounselorId, setOriginalCounselorId] = useState(null);
  const [originalCounselorName, setOriginalCounselorName] = useState('');

  // Helper function to fetch appointments
  const fetchUserAppointments = async () => {
    const userPublicId = localStorage.getItem("user_public_id");

    console.log('Fetching appointments for user_public_id:', userPublicId);

    if (!userPublicId) {
      console.error('No user_public_id found in localStorage');
      return [];
    }

    try {
      const res = await fetch(`${BASE_URL}/api/appointments?user_public_id=${userPublicId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Raw appointments response:', data);
      
      let appts = [];
      if (data && data.success && Array.isArray(data.data)) {
        appts = data.data;
        console.log('Found appointments:', appts);
      }
      
      // Sort appointments by date/time (upcoming first)
      appts.sort((a, b) => {
        const dateA = new Date(a.date_time);
        const dateB = new Date(b.date_time);
        return dateA - dateB;
      });
      
      return appts;
    } catch (err) {
      console.error('Error fetching appointments:', err);
      return [];
    }
  };

  // Fetch user info and their appointments
  useEffect(() => {
    const token = localStorage.getItem("publicToken");
    const userPublicId = localStorage.getItem("user_public_id");

    if (!token || !userPublicId) {
      router.push("/user-public/login");
      return;
    }

    // Fetch current user profile to get the latest name
    fetch(`${BASE_URL}/api/public-users/profile/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data) {
        setPatientName(data.data.full_name);
        localStorage.setItem("full_name", data.data.full_name); // Update localStorage with latest name
      }
    })
    .catch(err => {
      console.error('Error fetching user profile:', err);
      // Fallback to localStorage name if profile fetch fails
      const fallbackName = localStorage.getItem("full_name");
      if (fallbackName) {
        setPatientName(fallbackName);
      }
    });

    setLoadingAppointments(true);

    fetchUserAppointments()
      .then(appointments => {
        setAppointments(appointments);
      })
      .finally(() => setLoadingAppointments(false));
  }, [router]);

  const handleCancel = async (appointment) => {
    try {
      const appointmentId = appointment.id || appointment.appointment_id;
      console.log('Cancelling appointment with ID:', appointmentId);
      
      if (!appointmentId) {
        alert('Error: Cannot cancel appointment - ID is missing');
        console.error('Appointment object:', appointment);
        return;
      }
      
      const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}`, { method: "DELETE" });
      
      if (res.ok) {
        // Refresh appointments list to reflect the cancellation
        const appointments = await fetchUserAppointments();
        setAppointments(appointments);
        alert('Appointment cancelled successfully');
      } else {
        const data = await res.json();
        alert(data.message || data.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Error cancelling appointment');
    }
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
          console.log(`Received ${data.data.length} registered ${type}s from API:`, data.data);
          
          // Backend already filters for registered professionals and returns only id and full_name
          setDoctorList(data.data);
          console.log(`Loaded ${data.data.length} registered ${type}s`);
        } else {
          console.error(`Invalid response format from ${endpoint}:`, data);
          setDoctorList([]);
        }
        setSelectedDoctor("");
        setSelectedDoctorInfo(null);
      })
      .catch((err) => {
        console.error(`Error fetching ${type}s:`, err);
        setDoctorList([]);
      })
      .finally(() => setLoadingDoctors(false));
  }, [type]);

  useEffect(() => {
    console.log('Appointments state after fetch:', appointments);
    appointments.forEach((apt, index) => {
      console.log(`Appointment ${index}:`, {
        id: apt.id,
        role: apt.role,
        name_patient: apt.name_patient,
        assigned_to: apt.assigned_to,
        date_time: apt.date_time
      });
    });
  }, [appointments]);

  function validate() {
    const errs = {};
    if (!type) errs.type = "Type is required";
    if (!patientName) errs.patientName = "Patient name is required";
    if (!selectedDoctor) errs.selectedDoctor = "Please select a doctor/counselor";
    if (!date) errs.date = "Date is required";
    
    // Check if date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    if (selectedDate < today) {
      errs.date = "Cannot select a date in the past";
    }
    
    if (!time) {
      errs.time = "Time is required";
    } else {
      // Business hours validation: 8:00 AM to 7:00 PM
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      const startTime = 8 * 60; // 8:00 AM in minutes
      const endTime = 19 * 60; // 7:00 PM in minutes
      
      if (timeInMinutes < startTime || timeInMinutes >= endTime) {
        errs.time = "Appointments can only be booked between 8:00 AM and 7:00 PM";
      }
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Additional validation to ensure date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    if (selectedDate < today) {
      setErrors(prev => ({
        ...prev,
        date: "Cannot select a date in the past"
      }));
      return; // Prevent form submission
    }
    
    if (!validate()) return;

    // Additional business hours validation before submitting
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const startTime = 8 * 60; // 8:00 AM in minutes
    const endTime = 19 * 60; // 7:00 PM in minutes
    
    if (timeInMinutes < startTime || timeInMinutes >= endTime) {
      setErrors(prev => ({
        ...prev,
        time: "Appointments can only be booked between 8:00 AM and 7:00 PM"
      }));
      return; // Prevent form submission
    }

    if (editingAppointment) {
      // Compare current and original values
      const dateChanged = date !== originalDate;
      const timeChanged = time !== originalTime;
      const doctorChanged = selectedDoctorId !== originalCounselorId && selectedDoctor !== originalCounselorName;
      let newDateValue = date;
      let newTimeValue = time;
      let newDoctorId = selectedDoctorId;
      let newDoctorName = selectedDoctor;
      // If only date changed
      if (dateChanged && !timeChanged && !doctorChanged) {
        newTimeValue = originalTime;
        newDoctorId = originalCounselorId;
        newDoctorName = originalCounselorName;
      }
      // If only time changed
      else if (!dateChanged && timeChanged && !doctorChanged) {
        newDateValue = originalDate;
        newDoctorId = originalCounselorId;
        newDoctorName = originalCounselorName;
      }
      // If only doctor changed
      else if (!dateChanged && !timeChanged && doctorChanged) {
        newDateValue = originalDate;
        newTimeValue = originalTime;
      }
      // If date and time changed
      else if (dateChanged && timeChanged && !doctorChanged) {
        newDoctorId = originalCounselorId;
        newDoctorName = originalCounselorName;
      }
      // If date and doctor changed
      else if (dateChanged && !timeChanged && doctorChanged) {
        newTimeValue = originalTime;
      }
      // If time and doctor changed
      else if (!dateChanged && timeChanged && doctorChanged) {
        newDateValue = originalDate;
      }
      // If all changed, use all new values
      // Compose newDateTime
      const newDateTime = `${newDateValue}T${newTimeValue.length === 5 ? newTimeValue : newTimeValue.slice(0,5)}`;
      // Always include all required fields in the payload
      const appointmentData = {
        role: editingAppointment.role,
        user_public_id: editingAppointment.user_public_id,
        assigned_to: newDoctorName,
        status: editingAppointment.status,
        contact: editingAppointment.contact,
        date_time: newDateTime,
      };
      if (editingAppointment.role === 'Counselor') {
        appointmentData.counselor_id = newDoctorId;
      } else if (editingAppointment.role === 'Psychiatrist') {
        appointmentData.psychiatrist_id = newDoctorId;
      }
      let res;
      const appointmentId = editingAppointment.id || editingAppointment.appointment_id;
      res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
      const data = await res.json();
      console.log('Response status:', res.status);
      console.log('Response data:', data);
      if (res.ok) {
        alert(`Appointment updated successfully!`);
        setShowModal(false);
        setEditingAppointment(null);
        setLoadingAppointments(true);
        fetchUserAppointments()
          .then(appointments => {
            setAppointments(appointments);
          })
          .finally(() => setLoadingAppointments(false));
      } else {
        let errorMessage = data.error || data.message || `Server returned status ${res.status}`;
        if (res.status === 409) {
          alert(errorMessage || 'This time slot is already booked. Please choose another hour.');
        } else {
          alert(`Failed to update appointment: ${errorMessage}`);
        }
      }
      return;
    } else {
      // Booking a new appointment (not editing)
      const newDateTime = `${date}T${time.length === 5 ? time : time.slice(0,5)}`;
      const appointmentData = {
        role: type,
        user_public_id: localStorage.getItem("user_public_id"),
        assigned_to: selectedDoctor,
        status: 'In Progress',
        contact: localStorage.getItem("email") || "user@example.com",
        date_time: newDateTime,
      };
      if (type === 'Counselor') {
        appointmentData.counselor_id = selectedDoctorId;
      } else if (type === 'Psychiatrist') {
        appointmentData.psychiatrist_id = selectedDoctorId;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/appointments/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointmentData)
        });
        const data = await res.json();
        if (res.ok) {
          alert('Appointment booked successfully!');
          setShowModal(false);
          setLoadingAppointments(true);
          fetchUserAppointments()
            .then(appointments => {
              setAppointments(appointments);
            })
            .finally(() => setLoadingAppointments(false));
        } else {
          let errorMessage = data.error || data.message || `Server returned status ${res.status}`;
          if (res.status === 409) {
            alert(errorMessage || 'This time slot is already booked. Please choose another hour.');
          } else {
            alert(`Failed to book appointment: ${errorMessage}`);
          }
        }
      } catch (err) {
        console.error('Request error:', err);
        alert('Server error.');
      }
      return;
    }
  }

  function handleRescheduleClick(appointment) {
    console.log('Rescheduling appointment:', appointment);
    console.log('Appointment ID:', appointment.id);
    setEditingAppointment(appointment);
    
    if (!appointment.date_time) {
      console.error('Missing date_time in appointment:', appointment);
      alert('Error: Cannot reschedule appointment - date/time information is missing');
      return;
    }
    
    const [datePart, timePart] = appointment.date_time.split(' ');
    
    if (!datePart || !timePart) {
      console.error('Invalid date_time format:', appointment.date_time);
      alert('Error: Cannot reschedule appointment - invalid date/time format');
      return;
    }
    
    // Check if the appointment date is in the past
    const appointmentDate = new Date(datePart);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    // If appointment date is in the past, set to today's date
    const dateToSet = appointmentDate < today ? getTodayDateString() : datePart;
    
    setType(appointment.role);
    
    // Fetch the doctor/psychiatrist list first to ensure we have the data
    const endpoint = appointment.role === 'Counselor' ? `${BASE_URL}/api/counselors` : `${BASE_URL}/api/psychiatrists`;
    setLoadingDoctors(true);
    
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          console.log(`Rescheduling: Received ${data.data.length} registered ${appointment.role}s from API`);
          
          // Backend already filters for registered professionals and returns only id and full_name
          setDoctorList(data.data);
          console.log(`Rescheduling: Loaded ${data.data.length} registered ${appointment.role}s`);
          
          // Find the doctor/psychiatrist in the list and set as selected
          const doctor = data.data.find(doc => doc.full_name === appointment.assigned_to);
          setSelectedDoctor(appointment.assigned_to);
          setSelectedDoctorInfo(doctor || null);
          setSelectedDoctorId(doctor ? doctor.id : null);
          // Store original counselor/psychiatrist info for comparison
          setOriginalCounselorId(doctor ? doctor.id : null);
          setOriginalCounselorName(appointment.assigned_to);
          
          // If the previously assigned doctor is no longer registered, log a warning
          if (!doctor && appointment.assigned_to) {
            console.warn(`Previously assigned ${appointment.role} "${appointment.assigned_to}" is no longer registered or available`);
          }
        } else {
          console.error(`Invalid response format from ${endpoint}:`, data);
          setDoctorList([]);
          setOriginalCounselorId(null);
          setOriginalCounselorName(appointment.assigned_to);
        }
      })
      .catch(err => {
        console.error(`Rescheduling: Error fetching ${appointment.role}s:`, err);
        // Still set the name even if we couldn't fetch the full info
        setSelectedDoctor(appointment.assigned_to);
        setOriginalCounselorId(null);
        setOriginalCounselorName(appointment.assigned_to);
      })
      .finally(() => setLoadingDoctors(false));
    
    setDate(dateToSet);
    setTime(timePart);
    setShowModal(true);
    setOriginalDateTime(appointment.date_time); // Store the original datetime string
    setOriginalDate(datePart);
    setOriginalTime(timePart);
  }

  function handleAddNewClick() {
    setEditingAppointment(null);
    setType('');
    setSelectedDoctor('');
    setSelectedDoctorInfo(null);
    setDate(getTodayDateString());
    setTime('');
    setShowModal(true);
  }

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Hamburger menu for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={28} color="#000" className="text-black" stroke="#000" />
      </button>
      {/* Sidebar as drawer on mobile, static on desktop */}
      <div>
        {/* Mobile Drawer */}
        <div
          className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} md:hidden`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 md:static md:translate-x-0 md:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:min-h-screen`}
        >
          {/* Close button for mobile */}
          <button
            className="md:hidden absolute top-4 right-4 z-50 bg-gray-100 rounded-full p-1 border border-gray-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} color="#000" />
          </button>
          <Sidebar activePage="APPOINTMENTS" />
        </aside>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
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
                    onChange={(e) => {
                      setSelectedDoctor(e.target.value);
                      const selected = doctorList.find(doc => doc.full_name === e.target.value);
                      setSelectedDoctorInfo(selected || null);
                      setSelectedDoctorId(selected ? selected.id : null);
                    }}
                    required
                    disabled={!type || loadingDoctors}
                  >
                    <option value="">{loadingDoctors ? "Loading..." : `Select ${type || "Doctor/Counselor"}`}</option>
                    {doctorList.length > 0 ? (
                      doctorList.map(doc => {
                        // Display only the full name in the dropdown
                        return (
                          <option key={doc.id} value={doc.full_name}>{doc.full_name}</option>
                        );
                      })
                    ) : (
                      type && <option value="" disabled>No registered {type}s available at the moment</option>
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
                    min={getTodayDateString()}
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
                    min="08:00"
                    max="19:00"
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
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <span>Loading your appointments...</span>
                      </div>
                    </td>
                  </tr>
                ) : !appointments || appointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <Calendar size={48} className="mb-2 text-gray-300" />
                        <span className="font-medium">No appointments found</span>
                        <span className="text-sm mt-1">Click "Schedule New Appointment" to book your first session</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((item) => {
                    // Split date_time string from backend "YYYY-MM-DD HH:MM:SS"
                    const [datePart, timePart] = item.date_time ? item.date_time.split(' ') : ['', ''];
                    
                    // Check if appointment is in the past
                    const appointmentDate = new Date(item.date_time);
                    const now = new Date();
                    const isPast = appointmentDate < now;
                    
                    return (
                      <tr key={item.id} className={`border-b last:border-0 hover:bg-gray-50 transition ${isPast ? 'opacity-60' : ''}`}>
                        <td className={`py-3 px-4 font-semibold whitespace-nowrap ${isPast ? 'text-gray-500' : 'text-gray-800'}`}>
                          {datePart}
                          {isPast && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Past</span>}
                        </td>
                        <td className={`py-3 px-4 whitespace-nowrap ${isPast ? 'text-gray-500' : 'text-gray-700'}`}>{timePart}</td>
                        <td className={`py-3 px-4 whitespace-nowrap ${isPast ? 'text-gray-500' : 'text-gray-700'}`}>{item.assigned_to} ({item.role})</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {!isPast && (
                            <>
                              <button className="text-blue-600 hover:underline font-medium mr-4 transition" onClick={() => handleRescheduleClick(item)}>Reschedule</button>
                              <button className="text-red-500 hover:underline font-medium transition" onClick={() => handleCancel(item)}>Cancel</button>
                            </>
                          )}
                          {isPast && (
                            <span className="text-gray-400 text-sm">Completed</span>
                          )}
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