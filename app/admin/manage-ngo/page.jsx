"use client";
import { useEffect, useState } from 'react';
import AdminSidebar from '../Sidebar';

function EditModal({ activity, onClose, onSave, isAdd }) {
  // Helper function to format date consistently
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    
    // If it's already a proper YYYY-MM-DD string, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a datetime string or date object, extract just the date part
    try {
      const date = new Date(dateValue);
      // Use local date to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const [form, setForm] = useState(activity ? {
    ...activity,
    activity_date: formatDateForInput(activity.activity_date),
    address: activity.address || ''
  } : {
    ngo_name: '',
    ngo_registration_number: '',
    contact_person_name: '',
    contact_email: '',
    contact_phone: '',
    ngo_official_website: '',
    activity_title: '',
    activity_date: '',
    activity_time: '',
    activity_location: '',
    address: '',
    activity_description: '',
  });
  const [fileReg, setFileReg] = useState(null);
  const [fileSupp, setFileSupp] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (activity) {
      setForm({ 
        ...activity, 
        activity_date: formatDateForInput(activity.activity_date), 
        address: activity.address || '' 
      });
    }
  }, [activity]);
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleFileChange = e => {
    if (e.target.name === 'ngo_registration_proof') setFileReg(e.target.files[0]);
    if (e.target.name === 'supporting_document') setFileSupp(e.target.files[0]);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.address || form.address.trim() === '') {
      setError('Address is required.');
      return;
    }
    if (!form.activity_date) {
      setError('Date is required.');
      return;
    }
    console.log('FORM SUBMIT VALUE (activity_date):', form.activity_date, 'Type:', typeof form.activity_date);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'activity_time' && v) {
        const time = v.length > 5 ? v.slice(0, 5) : v;
        formData.append('activity_time', time);
      } else if (k === 'activity_date' && v) {
        // Ensure we send a clean YYYY-MM-DD format date string
        const cleanDate = formatDateForInput(v);
        formData.append('activity_date', cleanDate);
        console.log('FRONTEND SENDING DATE:', cleanDate);
      } else {
        formData.append(k, v);
      }
    });
    console.log('Submitting activity_time:', form.activity_time);
    if (fileReg) formData.append('ngo_registration_proof', fileReg);
    if (fileSupp) formData.append('supporting_document', fileSupp);
    await onSave(formData);
  };
  // Helper to get min value for date (today) - return as string
  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg w-full max-w-2xl space-y-4">
        <h2 className="text-xl font-bold mb-2 text-black">{isAdd ? 'Add NGO Activity' : 'Edit NGO Activity'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="ngo_name" value={form.ngo_name||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black" placeholder="NGO Name" />
          <input name="ngo_registration_number" value={form.ngo_registration_number||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black" placeholder="Reg. Number" />
          <input name="contact_person_name" value={form.contact_person_name||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black" placeholder="Contact Person" />
          <input name="contact_email" value={form.contact_email||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black" placeholder="Email" />
          <input name="contact_phone" value={form.contact_phone||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black" placeholder="Phone" />
          <input name="ngo_official_website" value={form.ngo_official_website||''} onChange={handleChange} className="border rounded px-3 py-2 text-black" placeholder="Website" />
        </div>
        <div>
          <label className="block text-black">NGO Registration Proof (Image/PDF)</label>
          <input name="ngo_registration_proof" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="block w-full text-black" required={isAdd} />
        </div>
        <input name="activity_title" value={form.activity_title||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black w-full" placeholder="Activity Title" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="activity_date"
            type="date"
            value={form.activity_date || ''}
            onChange={handleChange}
            min={getMinDate()}
            required
            className="border rounded px-3 py-2 text-black"
            placeholder="Date"
          />
          <input name="activity_time" type="time" value={form.activity_time||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black" placeholder="Time" />
          <input name="activity_location" value={form.activity_location||''} onChange={handleChange} required className="border rounded px-3 py-2 text-black" placeholder="Location" />
        </div>
        <input
          name="address"
          type="text"
          value={form.address || ''}
          onChange={handleChange}
          required
          className="border rounded px-3 py-2 text-black w-full mt-2"
          placeholder="Address"
        />
        {error && <div className="text-red-600 text-sm font-medium mt-1">{error}</div>}
        <textarea name="activity_description" value={form.activity_description||''} onChange={handleChange} className="w-full border rounded px-3 py-2 text-black" placeholder="Description" />
        <div>
          <label className="block text-black">Supporting Document (Optional)</label>
          <input name="supporting_document" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="block w-full text-black" />
        </div>
        <div className="flex gap-4 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-black">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">{isAdd ? 'Add' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

  const BACKEND_URL = '';

function PDFIframe({ filename }) {
  const [canPreviewPdf, setCanPreviewPdf] = useState(true);
  const src = `${BACKEND_URL}/uploads/ngo_documents/${filename}`;
  useEffect(() => { console.log('PDF iframe src:', src); }, [src]);
  return canPreviewPdf ? (
    <iframe
      src={src}
      width="100%"
      height="600px"
      style={{ border: "none" }}
      onError={() => setCanPreviewPdf(false)}
    />
  ) : (
    <div className="text-black text-center mt-8">
      <p>Preview not available. <a href={src} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Click here to open or download the PDF</a>.</p>
    </div>
  );
}

export default function ManageNGOActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFilename, setPdfFilename] = useState("");

  // Helper function to format date for display
  const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return '';
    
    // If it's already a proper YYYY-MM-DD string, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a datetime string or date object, extract just the date part
    try {
      const date = new Date(dateValue);
      // Use local date to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date display formatting error:', error);
      return '';
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ngo-activities');
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      
      // Debug log: log the activity_date values received from API
      console.log('ACTIVITIES FROM API:');
      arr.forEach((activity, index) => {
        console.log(`Activity ${index + 1} - ID: ${activity.id}, Date: ${activity.activity_date}, Type: ${typeof activity.activity_date}`);
      });
      
      setActivities(arr);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleEdit = id => {
    setEditId(id);
    setShowEdit(true);
  };
  const handleDelete = id => {
    setDeleteId(id);
    setConfirmDelete(true);
  };
  const doDelete = async () => {
    await fetch(`/api/ngo-activities/${deleteId}`, { method: 'DELETE' });
    setConfirmDelete(false);
    setDeleteId(null);
    fetchActivities();
  };
  const handleOpenAddModal = () => setShowAdd(true);

  const doAdd = async (formData) => {
    const res = await fetch('/api/ngo-activities', { method: 'POST', body: formData });
    if (res.ok) {
      setShowAdd(false);
      fetchActivities();
    } else {
      alert('Failed to add NGO activity');
    }
  };

  const doSave = async (formData) => {
    await fetch(`/api/ngo-activities/${editId}`, { method: 'PUT', body: formData });
    setShowEdit(false);
    setEditId(null);
    fetchActivities();
  };

  const editing = activities.find(a => a.id === editId);

  const handlePdfClick = (e, url) => {
    if (url.toLowerCase().endsWith('.pdf')) {
      e.preventDefault();
      const parts = url.split('/');
      setPdfFilename(parts[parts.length - 1]);
      setShowPdfModal(true);
    }
  };
  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfFilename("");
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-8 overflow-x-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-black">Manage NGO Activities</h1>
          <button
            className="bg-[#6b6bce] hover:bg-[#5757b2] text-white font-semibold px-4 py-2 rounded"
            onClick={handleOpenAddModal}
          >
            Add New NGO Activity
          </button>
        </div>
        {loading ? (
          <div className="text-black">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded shadow text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="p-2 text-black font-bold">NGO Name</th>
                  <th className="p-2 text-black font-bold">Reg. Number</th>
                  <th className="p-2 text-black font-bold">Contact Person</th>
                  <th className="p-2 text-black font-bold">Email</th>
                  <th className="p-2 text-black font-bold">Phone</th>
                  <th className="p-2 text-black font-bold">Website</th>
                  <th className="p-2 text-black font-bold">Reg. Proof</th>
                  <th className="p-2 text-black font-bold">Activity Title</th>
                  <th className="p-2 text-black font-bold">Date</th>
                  <th className="p-2 text-black font-bold">Time</th>
                  <th className="p-2 text-black font-bold">Location</th>
                  <th className="p-2 text-black font-bold">Address</th>
                  <th className="p-2 text-black font-bold">Description</th>
                  <th className="p-2 text-black font-bold">Supporting Doc</th>
                  <th className="p-2 text-black font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr><td colSpan={13} className="text-center p-4 text-black">No activities found.</td></tr>
                ) : (
                  [...activities].reverse().map((a, i) => (
                    <tr key={a.id || i} className="border-b last:border-none hover:bg-neutral-50">
                      <td className="p-2 text-black font-medium">{a.ngo_name}</td>
                      <td className="p-2 text-black">{a.ngo_registration_number}</td>
                      <td className="p-2 text-black">{a.contact_person_name}</td>
                      <td className="p-2 text-black">{a.contact_email}</td>
                      <td className="p-2 text-black">{a.contact_phone}</td>
                      <td className="p-2 text-black">
                        {a.ngo_official_website ? (
                          <a href={a.ngo_official_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{a.ngo_official_website}</a>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-black">
                        {a.ngo_registration_proof ? (
                          <a
                            href={`${BACKEND_URL}/uploads/ngo_documents/${a.ngo_registration_proof}`}
                            onClick={e => handlePdfClick(e, `${BACKEND_URL}/uploads/ngo_documents/${a.ngo_registration_proof}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {a.ngo_registration_proof}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-black font-medium">{a.activity_title}</td>
                      <td className="p-2 text-black">
                        {formatDateForDisplay(a.activity_date)}
                      </td>
                      <td className="p-2 text-black">{a.activity_time}</td>
                      <td className="p-2 text-black">{a.activity_location}</td>
                      <td className="p-2 text-black">{a.address}</td>
                      <td className="p-2 text-black max-w-xs whitespace-pre-line break-words">{a.activity_description}</td>
                      <td className="p-2 text-black">
                        {a.supporting_document ? (
                          <a
                            href={`${BACKEND_URL}/uploads/ngo_documents/${a.supporting_document}`}
                            onClick={e => handlePdfClick(e, `${BACKEND_URL}/uploads/ngo_documents/${a.supporting_document}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {a.supporting_document}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-black flex gap-2">
                        <button onClick={() => handleEdit(a.id)} className="px-2 py-1 bg-yellow-400 text-black rounded">Edit</button>
                        <button onClick={() => handleDelete(a.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {showEdit && editing && (
          <EditModal activity={editing} onClose={() => setShowEdit(false)} onSave={doSave} />
        )}
        {showAdd && (
          <EditModal activity={null} onClose={() => setShowAdd(false)} onSave={doAdd} isAdd />
        )}
        {showPdfModal && pdfFilename && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-xl p-4 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-black">PDF Preview</h2>
                <button onClick={handleClosePdfModal} className="px-3 py-1 bg-gray-200 rounded text-black">Close</button>
              </div>
              <PDFIframe filename={pdfFilename} />
            </div>
          </div>
        )}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg">
              <div className="mb-4 text-black">Are you sure you want to delete this activity?</div>
              <div className="flex gap-4 justify-end">
                <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded bg-gray-200 text-black">Cancel</button>
                <button onClick={doDelete} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 