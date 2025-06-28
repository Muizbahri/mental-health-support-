"use client";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Users,
  BookOpen,
  MessageCircle,
  AlertTriangle,
  LogOut,
  UserCircle,
  ArrowRight,
  Edit,
  Trash2,
  Plus,
  Calendar,
  FileText,
  User,
  MoreVertical,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';

const sidebarMenu = [
  { icon: <Home size={20} />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <Users size={20} />, label: "Manage Users", path: "/admin/manage-users" },
  { icon: <BookOpen size={20} />, label: "Manage Materials", path: "/admin/manage-materials" },
  { icon: <MessageCircle size={20} />, label: "Manage Feedback", path: "/admin/manage-feedbacks" },
  { icon: <Calendar size={20} />, label: "Manage Appointments", path: "/admin/manage-appointments" },
  { icon: <AlertTriangle size={20} />, label: "Manage Emergency Cases", path: "/admin/manage-emergency" },
];

export default function ManageUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [modal, setModal] = useState({ open: false, type: null, user: null });
  const [publicUsers, setPublicUsers] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [psychiatrists, setPsychiatrists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const [psychiatristsRes, counselorsRes, publicUsersRes] = await Promise.all([
        fetch("http://194.164.148.171:5000/api/psychiatrists"),
        fetch("http://194.164.148.171:5000/api/counselors"),
        fetch("http://194.164.148.171:5000/api/users/public")
      ]);
      const psychiatristsData = await psychiatristsRes.json();
      const counselorsData = await counselorsRes.json();
      const publicUsersData = await publicUsersRes.json();
      
      if (psychiatristsData.success) setPsychiatrists(psychiatristsData.data);
      if (counselorsData.success) setCounselors(counselorsData.data);
      if (publicUsersData.success) setPublicUsers(publicUsersData.data);
      
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function handleEdit(type, user) {
    setModal({ open: true, type, user });
  }

  async function handleDelete(type, id) {
    const endpoint = {
      public: `/api/delete-public/${id}`,
      counselor: `/api/delete-counselor/${id}`,
      psychiatrist: `/api/delete-psychiatrist/${id}`
    }[type];
    await fetch(endpoint, { method: "DELETE" });
    fetchData();
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-pink-50 flex overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-48 bg-white rounded-xl shadow-lg m-2 flex flex-col p-3 justify-between">
        <div>
          <div className="flex items-center mb-4">
            <Image src="/brain-logo.png" width={24} height={24} alt="Logo" className="mr-1.5" />
            <span className="font-semibold text-sm text-gray-700">MENTAL HEALTH CARE</span>
          </div>
          <nav>
            <ul className="space-y-0.5">
              {sidebarMenu.map((item, idx) => (
                <li key={item.label}>
                  <button
                    className={`flex items-center w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 transition font-medium ${item.label === "Manage Users" ? 'bg-blue-50' : ''}`}
                    onClick={() => router.push(item.path)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <button
          className="flex items-center gap-2 mt-8 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition"
          onClick={() => {
            localStorage.removeItem('adminToken');
            router.push('/admin/login');
          }}
        >
          <LogOut size={20} />
          Log Out
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 px-8 py-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">Manage Users</h1>
        <div className="space-y-8">
          <UserTable
            title="Psychiatrists"
            columns={[
              "full_name", "email", "ic_number", "age", "phone_number",
              "med_number", "certificate", "profile_image", "location",
              "address",
              "latitude", "longitude"
            ]}
            data={psychiatrists}
            onAddNew={() => setModal({ open: true, type: "psychiatrist", user: null })}
            onEdit={user => handleEdit("psychiatrist", user)}
            onDelete={id => handleDelete("psychiatrist", id)}
          />
          <UserTable
            title="Counselors"
            columns={[
              "full_name", "email", "ic_number", "age", "phone_number",
              "registration_number", "certificate", "profile_image", "location",
              "address",
              "latitude", "longitude"
            ]}
            data={counselors}
            onAddNew={() => setModal({ open: true, type: "counselor", user: null })}
            onEdit={user => handleEdit("counselor", user)}
            onDelete={id => handleDelete("counselor", id)}
          />
          <UserTable
            title="Public Users"
            columns={["full_name", "email", "ic_number", "age", "phone_number", "profile_image"]}
            data={publicUsers}
            onAddNew={() => setModal({ open: true, type: "public", user: null })}
            onEdit={user => handleEdit("public", user)}
            onDelete={id => handleDelete("public", id)}
          />
        </div>
        {modal.open && (
          <UserModal type={modal.type} user={modal.user} onClose={() => { setModal({ open: false, type: null, user: null }); }} />
        )}
      </main>
    </div>
  );
}

function UserTable({ title, columns, data, onAddNew, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-gray-800">{title}</h2>
        <button
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          onClick={onAddNew}
        >
          <Plus size={16} /> Add New User
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-2 py-1.5 font-semibold text-sm text-gray-800 bg-gray-100 capitalize whitespace-nowrap border-b border-gray-200"
                >
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-2 py-1.5 bg-gray-100 border-b border-gray-200"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-gray-400 py-4 text-xs">
                  No data available
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                  {columns.map(col => (
                    <td
                      key={col}
                      className="px-2 py-1.5 whitespace-nowrap text-gray-800 text-xs"
                    >
                      {col === "certificate" ? (
                        row[col] ? (
                          <a
                            href={`http://194.164.148.171:5000/uploads/${row[col]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'underline' }}
                          >
                            {row[col]}
                          </a>
                        ) : (
                          <span className="text-gray-300">No Certificate</span>
                        )
                      ) : col === "profile_image" ? (
                        row[col] ? (
                          <img
                            src={`http://194.164.148.171:5000/uploads/${row[col]}`}
                            alt="Profile"
                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                          />
                        ) : (
                          <span className="text-gray-300">No Image</span>
                        )
                      ) : (
                        (row[col] !== undefined && row[col] !== null && row[col] !== "") ? String(row[col]) : <span className="text-gray-300">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 whitespace-nowrap flex gap-1">
                    <button className="flex items-center gap-0.5 px-1 py-0.5 text-blue-700 font-semibold hover:underline text-[11px]" onClick={() => onEdit(row)}><Edit size={12} />Edit</button>
                    <button className="flex items-center gap-0.5 px-1 py-0.5 text-red-700 font-semibold hover:underline text-[11px]" onClick={() => onDelete(row.id)}><Trash2 size={12} />Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserModal({ type, user, onClose }) {
  let fields = [];
  if (type === "public") {
    fields = [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "ic_number", label: "IC Number", type: "text", required: true },
      { name: "age", label: "Age", type: "number", required: true },
      { name: "phone_number", label: "Phone Number", type: "text", required: true },
      { name: "profile_image", label: "Profile Image", type: "file", required: false },
      { name: "password", label: "Password", type: "password", required: true },
    ];
  } else if (type === "counselor") {
    fields = [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "ic_number", label: "IC Number", type: "text", required: true },
      { name: "age", label: "Age", type: "number", required: true },
      { name: "phone_number", label: "Phone Number", type: "text", required: true },
      { name: "registration_number", label: "Registration Number", type: "text", required: true },
      { name: "certificate", label: "Certificate", type: "file", required: false },
      { name: "profile_image", label: "Profile Image", type: "file", required: false },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "address", label: "Address", type: "text", required: true },
      { name: "latitude", label: "Latitude", type: "number", required: true },
      { name: "longitude", label: "Longitude", type: "number", required: true },
      { name: "password", label: "Password", type: "password", required: true },
    ];
  } else if (type === "psychiatrist") {
    fields = [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "ic_number", label: "IC Number", type: "text", required: true },
      { name: "age", label: "Age", type: "number", required: true },
      { name: "phone_number", label: "Phone Number", type: "text", required: true },
      { name: "med_number", label: "Med Number", type: "text", required: true },
      { name: "certificate", label: "Certificate", type: "file", required: false },
      { name: "profile_image", label: "Profile Image", type: "file", required: false },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "address", label: "Address", type: "text", required: true },
      { name: "latitude", label: "Latitude", type: "number", required: true },
      { name: "longitude", label: "Longitude", type: "number", required: true },
      { name: "password", label: "Password", type: "password", required: true },
    ];
  }

  const [form, setForm] = useState(user || {});
  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const [errors, setErrors] = useState({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  async function handleLocationChange(e) {
    const location = e.target.value;
    setForm(f => ({ ...f, location }));

    if (location.length > 3) {
      setIsLoadingLocation(true);
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`
        );
        const data = await res.json();
        const result = data.features?.[0];
        if (result && result.geometry?.coordinates) {
          const [lng, lat] = result.geometry.coordinates;
          setForm(f => ({
            ...f,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    }
  }

  function handleICChange(e) {
    const ic = e.target.value;
    setForm(f => ({
      ...f,
      ic_number: ic
    }));

    if (/^\d{6}/.test(ic)) {
      const year = parseInt(ic.substring(0, 2), 10);
      const month = parseInt(ic.substring(2, 4), 10) - 1;
      const day = parseInt(ic.substring(4, 6), 10);
      const fullYear = year >= 0 && year <= 24 ? 2000 + year : 1900 + year;

      const birthDate = new Date(fullYear, month, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      setForm(f => ({
        ...f,
        age: age.toString()
      }));
    }
  }

  function handleChange(e) {
    const { name, value, type: inputType, files } = e.target;
    
    if (name === 'ic_number') {
      handleICChange(e);
      return;
    }

    if (name === 'location' && (type === 'counselor' || type === 'psychiatrist')) {
      handleLocationChange(e);
      return;
    }

    setForm(f => ({
      ...f,
      [name]: inputType === "file" ? files[0] : value
    }));
  }

  function validate() {
    const errs = {};
    fields.forEach(f => {
      if (f.required && !form[f.name]) {
        errs[f.name] = `${f.label} is required`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const isEdit = !!user;
    const endpoint = isEdit
      ? {
          public: `/api/update-public/${user.id}`,
          counselor: `/api/update-counselor/${user.id}`,
          psychiatrist: `/api/update-psychiatrist/${user.id}`
        }[type]
      : {
          public: '/api/add-public',
          counselor: '/api/add-counselor',
          psychiatrist: '/api/add-psychiatrist'
        }[type];
    const method = isEdit ? 'PUT' : 'POST';
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key]) {
        formData.append(key, form[key]);
      }
    });
    const loadingToast = toast.loading(isEdit ? 'Updating user...' : 'Adding user...');
    try {
      const res = await fetch(`http://194.164.148.171:5000${endpoint}`, {
        method,
        body: formData
      });
      if (res.ok) {
        toast.success(`${type} ${isEdit ? 'updated' : 'added'} successfully`, { id: loadingToast });
        onClose();
      } else {
        toast.error(`Failed to ${isEdit ? 'update' : 'add'} ${type}`, { id: loadingToast });
      }
    } catch (err) {
      toast.error('Something went wrong', { id: loadingToast });
    }
  }

  function handleCancel() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative flex flex-col max-h-[90vh]">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={onClose}>&times;</button>
        <h3 className="text-black text-xl font-semibold mb-4">Add New {type.charAt(0).toUpperCase() + type.slice(1).replace(/s$/, "")}</h3>
        <form className="flex flex-col flex-1" onSubmit={handleSubmit}>
          <div className="max-h-[75vh] overflow-y-auto px-4 py-2 space-y-4">
            {fields.map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                  {f.name === 'location' && (type === 'counselor' || type === 'psychiatrist') && isLoadingLocation && (
                    <span className="ml-2 text-xs text-blue-600">Loading coordinates...</span>
                  )}
                </label>
                {f.type === "file" ? (
                  <input
                    type="file"
                    name={f.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black file:text-black"
                  />
                ) : (
                  <input
                    type={f.type}
                    name={f.name}
                    value={form[f.name] || ''}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder:text-gray-500 ${f.name === 'age' ? 'bg-gray-50' : ''}`}
                    required={f.required}
                    readOnly={f.name === 'age'}
                  />
                )}
                {errors[f.name] && (
                  <p className="mt-1 text-sm text-red-600">{errors[f.name]}</p>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 