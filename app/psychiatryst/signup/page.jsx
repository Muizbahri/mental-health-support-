"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { User, Mail, IdCard, Calendar, Phone, Lock, FileText, Image as ImageIcon, MapPin, Hash, Search } from "lucide-react";
import { useRouter } from "next/navigation";

const GeoapifyMap = dynamic(() => import("../../../components/GeoapifyMap"), { ssr: false });

const DEFAULT_POSITION = { lat: 3.139, lon: 101.6869 };

async function geocodeAddress(address) {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features && data.features.length > 0) {
    const f = data.features[0];
    return {
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      formatted: f.properties.formatted,
    };
  }
  return null;
}

async function reverseGeocode(lat, lon) {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features && data.features.length > 0) {
    return data.features[0].properties.formatted;
  }
  return '';
}

export default function PsychiatristSignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    icNumber: "",
    age: "",
    phoneNumber: "",
    medicalNumber: "",
    certificate: null,
    profileImage: null,
    location: "",
    address: "",
    latitude: "",
    longitude: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [mapPos, setMapPos] = useState(DEFAULT_POSITION);
  const [markerPos, setMarkerPos] = useState(DEFAULT_POSITION);
  const [mapKey, setMapKey] = useState(0);

  function handleChange(e) {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value,
    }));
  }

  function handleICChange(e) {
    const ic = e.target.value;
    let age = "";
    if (/^\d{6}/.test(ic)) {
      const now = new Date();
      let year = parseInt(ic.slice(0, 2), 10);
      const month = parseInt(ic.slice(2, 4), 10) - 1;
      const day = parseInt(ic.slice(4, 6), 10);
      year += year < 30 ? 2000 : 1900;
      const birthDate = new Date(year, month, day);
      if (!isNaN(birthDate)) {
        const ageDifMs = now - birthDate;
        const ageDate = new Date(ageDifMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
    }
    setForm(f => ({ ...f, icNumber: ic, age: age ? String(age) : "" }));
  }

  async function handleAddressSearch() {
    if (!form.address) return;
    const geo = await geocodeAddress(form.address);
    if (geo) {
      setForm(f => ({ ...f, latitude: geo.lat, longitude: geo.lon }));
      setMapPos({ lat: geo.lat, lon: geo.lon });
      setMarkerPos({ lat: geo.lat, lon: geo.lon });
      setMapKey(k => k + 1);
    }
  }

  async function handleLatLonChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    let lat = name === "latitude" ? value : form.latitude;
    let lon = name === "longitude" ? value : form.longitude;
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      setMapPos({ lat: latNum, lon: lonNum });
      setMarkerPos({ lat: latNum, lon: lonNum });
      setMapKey(k => k + 1);
      const addr = await reverseGeocode(latNum, lonNum);
      setForm(f => ({ ...f, address: addr }));
    }
  }

  function handleMapMove(lat, lon) {
    setForm(f => ({ ...f, latitude: lat, longitude: lon }));
    setMapPos({ lat, lon });
    setMarkerPos({ lat, lon });
    setMapKey(k => k + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Validate required fields
    const requiredFields = [
      "fullName", "email", "icNumber", "age", "phoneNumber", "medicalNumber", "certificate", "profileImage", "location", "address", "latitude", "longitude", "password"
    ];
    for (const field of requiredFields) {
      if (!form[field] || (typeof form[field] === 'string' && form[field].trim() === '')) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1')}`);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", form.fullName);
      formData.append("email", form.email);
      formData.append("ic_number", form.icNumber);
      formData.append("age", form.age);
      formData.append("phone_number", form.phoneNumber);
      formData.append("med_number", form.medicalNumber);
      formData.append("certificate", form.certificate);
      formData.append("profile_image", form.profileImage);
      formData.append("location", form.location);
      formData.append("address", form.address);
      formData.append("latitude", form.latitude);
      formData.append("longitude", form.longitude);
      formData.append("password", form.password);
      const res = await fetch("http://194.164.148.171:5000/api/add-psychiatrist", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        alert("Sign up successful! You can now log in.");
        router.push("/psychiatryst/login");
      } else {
        const data = await res.json();
        alert(data.error || "Sign up failed. Please try again.");
      }
    } catch (err) {
      alert("Sign up failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Ensure valid map and marker positions
  const safeLat = (form.latitude && !isNaN(Number(form.latitude))) ? Number(form.latitude) : DEFAULT_POSITION.lat;
  const safeLon = (form.longitude && !isNaN(Number(form.longitude))) ? Number(form.longitude) : DEFAULT_POSITION.lon;
  const safeMarkerLat = (markerPos.lat && !isNaN(Number(markerPos.lat))) ? Number(markerPos.lat) : DEFAULT_POSITION.lat;
  const safeMarkerLon = (markerPos.lon && !isNaN(Number(markerPos.lon))) ? Number(markerPos.lon) : DEFAULT_POSITION.lon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-teal-50 to-pink-50 relative">
      <div className="absolute top-0 left-0 p-8 flex items-center">
        <img src="/brain-logo.png" width={40} height={40} alt="Logo" className="mr-3" />
        <span className="font-semibold text-xl text-gray-700">MENTAL HEALTH CARE</span>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-3xl shadow-xl px-8 py-10 w-full max-w-md mt-24">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Psychiatrist Sign Up</h1>
          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">IC Number</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="icNumber"
                  type="text"
                  placeholder="IC Number"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.icNumber}
                  onChange={handleICChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="age"
                  type="number"
                  placeholder="Age"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.age}
                  readOnly
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Medical Registration Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="medicalNumber"
                  type="text"
                  placeholder="Medical Registration Number"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.medicalNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="phoneNumber"
                  type="text"
                  placeholder="Phone Number"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Certificate</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Profile Image</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="profileImage"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Hospital/Clinic Name</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="location"
                  type="text"
                  placeholder="Hospital or Clinic Name"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Address</label>
              <div className="flex gap-2">
                <input
                  name="address"
                  type="text"
                  placeholder="Street, number, city, postcode"
                  className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="bg-teal-600 text-white px-4 py-2 rounded-lg" onClick={handleAddressSearch}>
                  <Search size={18} />
                  Search
                </button>
              </div>
            </div>
            <div className="w-full h-48 mb-2">
              <GeoapifyMap
                lat={safeLat}
                lon={safeLon}
                markerLat={safeMarkerLat}
                markerLon={safeMarkerLon}
                onMapMove={handleMapMove}
              />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-lg font-semibold text-gray-700 mb-1">Latitude</label>
                <input
                  name="latitude"
                  type="text"
                  placeholder="Latitude"
                  className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.latitude}
                  onChange={handleLatLonChange}
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-lg font-semibold text-gray-700 mb-1">Longitude</label>
                <input
                  name="longitude"
                  type="text"
                  placeholder="Longitude"
                  className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.longitude}
                  onChange={handleLatLonChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700 bg-gray-50"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 