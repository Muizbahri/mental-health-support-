"use client";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function Home() {
  const router = useRouter();
  const whatIsMentalHealthRef = useRef(null);
  const selectRoleRef = useRef(null);

  const handleScrollToWhatIsMentalHealth = () => {
    whatIsMentalHealthRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleScrollToSelectRole = () => {
    selectRoleRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="bg-gradient-to-b from-[#f7f8fd] to-[#eaf3fa] min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-br from-[#f7f8fd] to-[#eaf3fa]">
        <div className="flex flex-col items-center gap-2 mb-4">
          <Image src="/brain-logo.png" alt="Mental Health Logo" width={56} height={56} />
          <span className="text-lg font-semibold tracking-wide text-[#6b6bce]">MENTAL HEALTH CARE</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Welcome to Mental Health Care</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">Your safe space starts here. An initiative to support mental wellness for everyone.</p>
        <div className="flex gap-4 justify-center mb-2">
          <button className="bg-[#6b6bce] hover:bg-[#5757b2] text-white font-semibold px-6 py-3 rounded-full shadow transition" onClick={handleScrollToSelectRole}>Start Now</button>
          <button className="bg-white border border-[#6b6bce] text-[#6b6bce] hover:bg-[#f0f0ff] font-semibold px-6 py-3 rounded-full shadow transition" onClick={handleScrollToWhatIsMentalHealth}>Learn More</button>
        </div>
      </section>

      {/* What is Mental Health? */}
      <section ref={whatIsMentalHealthRef} className="w-full py-12 px-4 bg-white flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">What is Mental Health?</h2>
        <p className="text-gray-600 max-w-2xl mb-8 text-center">Mental health refers to our emotional, psychological, and social well-being. It affects how we think, feel, and act. This platform offers resources, assessments, and access to professionals to support your mental wellness journey.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl">
          <FeatureCard icon="💬" text="Understand emotions" />
          <FeatureCard icon="🤝" text="Connect with certified professionals" />
          <FeatureCard icon="📝" text="Self-assess your mental state" />
          <FeatureCard icon="🎵" text="Access calming music, videos, and articles" />
        </div>
      </section>

      {/* Our Mission */}
      <section className="w-full py-12 px-4 bg-gradient-to-r from-[#f7f8fd] to-[#eaf3fa] flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Our Mission</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <MissionCard icon="🔓" title="Normalize mental health conversations" desc="Breaking stigma and encouraging open dialogue about mental wellness." />
          <MissionCard icon="🧑‍⚕️" title="Connect users to licensed counselors & psychiatrists" desc="Providing access to qualified mental health professionals." />
          <MissionCard icon="🌱" title="Provide a calm, accessible digital wellness space" desc="Creating a safe, welcoming environment for mental health support." />
        </div>
      </section>

      {/* Select Your Role */}
      <section ref={selectRoleRef} className="w-full py-12 px-4 bg-white flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Select Your Role</h2>
        <p className="text-gray-600 mb-8">Choose your role to access the appropriate dashboard and features.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-5xl">
          <RoleCard icon="🛡️" title="Admin" desc="Manage the platform and oversee operations" onClick={() => router.push('/admin/login')} />
          <RoleCard icon="🧑‍💼" title="Counselor" desc="Provide counseling and support services" onClick={() => router.push('/counselor/login')} />
          <RoleCard icon="🧑‍⚕️" title="Psychiatry" desc="Medical mental health professionals" onClick={() => router.push('/psychiatryst/login')} />
          <RoleCard icon="🌍" title="Public" desc="Access resources and support services" onClick={() => router.push('/user-public/login')} />
        </div>
      </section>

      {/* Connect via Telegram Bot & NGO Activity Submission */}
      <section className="w-full flex flex-col md:flex-row gap-8 justify-center items-start py-16 px-4 bg-gradient-to-br from-[#eaf3fa] to-[#f7f8fd]">
        {/* Telegram Bot */}
        <div className="flex-1 max-w-md w-full bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center mb-8 md:mb-0">
          <h3 className="text-xl font-bold mb-2 text-gray-900">Connect via Telegram Bot</h3>
          <p className="text-gray-600 mb-6 text-center">Get instant mental health support through our Telegram bot. Scan the QR code below to start chatting with our AI assistant.</p>
          <Image
            src="/botdoc.jpg"
            alt="Telegram Bot QR Code"
            width={180}
            height={180}
            className="rounded-xl border-2 border-dashed border-gray-300 mb-4"
          />
          <span className="text-sm text-gray-500">Scan to Chat!<br/>24/7 support and guidance</span>
        </div>
        {/* NGO Activity Submission */}
        <div className="flex-1 max-w-xl w-full bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-2 text-gray-900">NGO Activity Submission</h3>
          <p className="text-gray-600 mb-4">Submit your NGO's mental health activities and events to be featured on our platform.</p>
          <form className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm text-gray-700 mb-2">
              <b>Important:</b> NGOs must provide valid registration proof. Submissions without this will not be approved.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="NGO Name" required dark />
              <Input label="NGO Registration Number" required dark />
              <Input label="Contact Person Name" required dark />
              <Input label="Contact Email" type="email" required dark />
              <Input label="Contact Phone" type="tel" required dark />
              <Input label="NGO Official Website" placeholder="https://your-ngo-website.com" dark />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">NGO Registration Proof <span className="text-red-500">*</span> (Image or PDF)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="block w-full text-sm border rounded px-3 py-2 text-gray-900 placeholder-gray-700" required />
            </div>
            <Input label="Activity Title" required dark />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Activity Date" type="date" required dark />
              <Input label="Activity Location" required dark />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Activity Description</label>
              <textarea className="w-full border rounded px-3 py-2 min-h-[60px] text-gray-900 placeholder-gray-700" placeholder="Describe your mental health activity or event..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Supporting Document (Optional)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="block w-full text-sm border rounded px-3 py-2 text-gray-900 placeholder-gray-700" />
            </div>
            <button type="submit" className="w-full bg-[#6b6bce] hover:bg-[#5757b2] text-white font-semibold py-3 rounded-full shadow transition mt-2">Submit Activity</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-[#232347] text-white flex flex-col items-center mt-auto">
        <div className="flex items-center gap-2 mb-1">
          <Image src="/brain-logo.png" alt="Mental Health Logo" width={28} height={28} />
          <span className="font-semibold tracking-wide">MENTAL HEALTH CARE</span>
        </div>
        <span className="text-sm text-gray-300">Supporting mental wellness for everyone</span>
      </footer>
    </main>
  );
}

// --- Helper Components ---
function FeatureCard({ icon, text }) {
  return (
    <div className="flex flex-col items-center bg-[#f7f8fd] rounded-xl p-6 shadow-sm">
      <span className="text-3xl mb-2">{icon}</span>
      <span className="font-medium text-gray-800 text-center">{text}</span>
    </div>
  );
}

function MissionCard({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center bg-white rounded-2xl p-6 shadow-md border border-gray-100">
      <span className="text-3xl mb-2">{icon}</span>
      <span className="font-semibold text-gray-900 mb-1 text-center">{title}</span>
      <span className="text-gray-600 text-center text-sm">{desc}</span>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick }) {
  return (
    <div
      className="flex flex-col items-center bg-[#f7f8fd] rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer"
      onClick={onClick}
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="font-semibold text-gray-900 mb-1 text-center">{title}</span>
      <span className="text-gray-600 text-center text-sm">{desc}</span>
    </div>
  );
}

function Input({ label, type = 'text', required = false, placeholder = '', dark = false }) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-1 ${dark ? 'text-gray-900' : ''}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className={`w-full border rounded px-3 py-2 text-sm ${dark ? 'text-gray-900 placeholder-gray-700' : ''}`}
      />
    </div>
  );
} 