import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, FileText, Lock, Camera,
  Edit3, Save, X, Check, ChevronDown, ChevronUp,
  Ticket, Calendar, Eye, EyeOff, ShieldCheck, KeyRound,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEventContext } from '../../context/EventContext';
import { ticketService } from '../../services/ticketService';
import QRCode from 'react-qr-code';
import Modal from '../../components/ui/Modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const map = {
    confirmed: 'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    expired:   'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.pending}`}>
      {status || 'pending'}
    </span>
  );
};

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
      <Icon className="w-4.5 h-4.5 text-[#E8441A]" size={18} />
      <h2 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wide">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Field Row ────────────────────────────────────────────────────────────────
const FieldRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3">
    {Icon && <Icon size={16} className="mt-0.5 text-[#E8441A] flex-shrink-0" />}
    <div>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-[#1A1A2E] font-medium">{value || <span className="text-gray-300 italic">Not set</span>}</p>
    </div>
  </div>
);

// ─── Password Input ───────────────────────────────────────────────────────────
const PwdInput = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      <div className="relative">
        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8441A] focus:border-transparent text-[#1A1A2E]"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { currentUser, updateProfile, uploadAvatar, changePassword } = useAuth();
  const { getEventById } = useEventContext();

  // — Edit profile state
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [form, setForm] = useState({ name: '', phone: '', bio: '', location: '' });
  const [formErrors, setFormErrors] = useState({});

  // — Avatar
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // — Change password state
  const [pwdOpen,  setPwdOpen]  = useState(false);
  const [pwdForm,  setPwdForm]  = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg,   setPwdMsg]   = useState({ text: '', ok: false });

  // — Tickets state
  const [tickets,  setTickets]  = useState([]);
  const [tkLoading, setTkLoading] = useState(true);
  const [qrTicket, setQrTicket] = useState(null);
  const [showAllTickets, setShowAllTickets] = useState(false);

  // Seed form when user loads
  useEffect(() => {
    if (currentUser) {
      setForm({
        name:     currentUser.name     || '',
        phone:    currentUser.phone    || '',
        bio:      currentUser.bio      || '',
        location: currentUser.location || '',
      });
      setAvatarPreview(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Load tickets
  useEffect(() => {
    if (!currentUser?.email) { setTkLoading(false); return; }
    ticketService.getMyTickets(currentUser.email)
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setTkLoading(false));
  }, [currentUser?.email]);

  // ── Avatar Upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    if (form.bio.length > 200) errs.bio = 'Bio must be 200 characters or less';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save Profile ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }
      await updateProfile(form);
      setSaveMsg('Saved!');
      setEditing(false);
      setAvatarFile(null);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      name:     currentUser.name     || '',
      phone:    currentUser.phone    || '',
      bio:      currentUser.bio      || '',
      location: currentUser.location || '',
    });
    setAvatarPreview(currentUser.avatar || '');
    setAvatarFile(null);
    setFormErrors({});
    setEditing(false);
  };

  // ── Change Password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) {
      setPwdMsg({ text: 'All fields are required.', ok: false }); return;
    }
    if (pwdForm.newPwd.length < 6) {
      setPwdMsg({ text: 'New password must be at least 6 characters.', ok: false }); return;
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdMsg({ text: 'Passwords do not match.', ok: false }); return;
    }
    setPwdSaving(true);
    setPwdMsg({ text: '', ok: false });
    try {
      await changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd });
      setPwdMsg({ text: 'Password updated successfully!', ok: true });
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      setTimeout(() => setPwdOpen(false), 2000);
    } catch (err) {
      setPwdMsg({ text: err.message, ok: false });
    } finally {
      setPwdSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <p className="text-gray-400 text-sm">Please log in to view your profile.</p>
      </div>
    );
  }

  const avatarUrl = avatarPreview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'U')}&background=E8441A&color=fff&size=128`;

  const isGoogle     = currentUser.authProvider === 'google';
  const displayedTickets = showAllTickets ? tickets : tickets.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">

        {/* ── Hero Card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-[#1A1A2E] via-[#16213E] to-[#0F3460] relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #E8441A 0%, transparent 60%)' }} />
          </div>

          {/* Avatar + name row */}
          <div className="px-6 pb-6">
            {/* Single flex-row: avatar pulls up with -mt-10, name beside it, button on far right */}
            <div className="flex flex-row items-end justify-between gap-4">

              {/* Left: Avatar + Name grouped together */}
              <div className="flex flex-row items-end gap-4">
                {/* Avatar — -mt-10 lifts it above the banner bottom edge */}
                <div className="relative w-20 h-20 flex-shrink-0 -mt-10">
                  <img
                    src={avatarUrl}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                  {editing && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 w-full h-full rounded-2xl bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera size={20} className="text-white" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </>
                  )}
                  {isGoogle && (
                    <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow border border-gray-100">
                      <svg viewBox="0 0 24 24" className="w-4 h-4">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </span>
                  )}
                </div>

                {/* Name + role — sits beside avatar, aligned to bottom */}
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-[#1A1A2E] leading-tight">{currentUser.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8441A]/10 text-[#E8441A] font-semibold capitalize">
                      {currentUser.role}
                    </span>
                    {isGoogle && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
                        Google Account
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Edit / Save buttons — ml-auto pushes to far right, pb-1 aligns baseline */}
              <div className="flex items-center gap-2 pb-1 flex-shrink-0">
                {saveMsg && (
                  <span className={`text-xs font-semibold ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-500'} flex items-center gap-1`}>
                    {saveMsg === 'Saved!' && <Check size={12} />}{saveMsg}
                  </span>
                )}
                {editing ? (
                  <>
                    <button onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                      <X size={14} /> Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#E8441A] text-white rounded-xl hover:bg-[#d63a15] transition-all disabled:opacity-60">
                      {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1A1A2E] border-2 border-gray-200 rounded-xl hover:border-[#E8441A] hover:text-[#E8441A] transition-all">
                    <Edit3 size={14} /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Upload hint while editing */}
            {editing && (
              <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                <Camera size={12} /> Hover over your avatar to upload a photo
              </p>
            )}
          </div>
        </div>

        {/* ── Profile Info ──────────────────────────────────────────────── */}
        <Section title="Profile Information" icon={User}>
          {editing ? (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8441A] focus:border-transparent text-[#1A1A2E] ${formErrors.name ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8441A] focus:border-transparent text-[#1A1A2E] ${formErrors.phone ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">City / Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Chennai, Tamil Nadu"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8441A] focus:border-transparent text-[#1A1A2E]"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Bio <span className="text-gray-400 font-normal">({form.bio.length}/200)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell others a little about yourself…"
                  rows={3}
                  maxLength={200}
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8441A] focus:border-transparent text-[#1A1A2E] resize-none ${formErrors.bio ? 'border-red-400' : 'border-gray-200'}`}
                />
                {formErrors.bio && <p className="text-xs text-red-500 mt-1">{formErrors.bio}</p>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldRow label="Full Name"   value={currentUser.name}     icon={User} />
              <FieldRow label="Email"       value={currentUser.email}    icon={Mail} />
              <FieldRow label="Phone"       value={currentUser.phone}    icon={Phone} />
              <FieldRow label="Location"    value={currentUser.location} icon={MapPin} />
              {(currentUser.bio) && (
                <div className="sm:col-span-2">
                  <FieldRow label="Bio" value={currentUser.bio} icon={FileText} />
                </div>
              )}
            </div>
          )}
        </Section>

        {/* ── Account Details ───────────────────────────────────────────── */}
        <Section title="Account" icon={ShieldCheck}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Account Type"
              value={isGoogle ? 'Google Sign-In' : 'Email & Password'}
              icon={ShieldCheck} />
            <FieldRow label="Role"
              value={currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : ''}
              icon={User} />
          </div>
        </Section>

        {/* ── Change Password (local users only) ───────────────────────── */}
        {!isGoogle && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => { setPwdOpen(o => !o); setPwdMsg({ text: '', ok: false }); }}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound size={18} className="text-[#E8441A]" />
                <span className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wide">Change Password</span>
              </div>
              {pwdOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {pwdOpen && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-4">
                <PwdInput label="Current Password"  value={pwdForm.current}
                  onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))}
                  placeholder="Enter current password" />
                <PwdInput label="New Password"       value={pwdForm.newPwd}
                  onChange={e => setPwdForm(p => ({ ...p, newPwd: e.target.value }))}
                  placeholder="At least 6 characters" />
                <PwdInput label="Confirm New Password" value={pwdForm.confirm}
                  onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password" />

                {pwdMsg.text && (
                  <p className={`text-sm font-medium flex items-center gap-1.5 ${pwdMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {pwdMsg.ok ? <Check size={14} /> : null}{pwdMsg.text}
                  </p>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={pwdSaving}
                  className="w-full py-2.5 text-sm font-semibold bg-[#1A1A2E] text-white rounded-xl hover:bg-[#2a2a4e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {pwdSaving
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating…</>
                    : <><Lock size={14} />Update Password</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── My Tickets ────────────────────────────────────────────────── */}
        <Section title="My Tickets" icon={Ticket}>
          {tkLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="w-6 h-6 border-2 border-[#E8441A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ticket size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">No tickets yet</p>
              <p className="text-xs text-gray-300 mt-1">Browse events and register to see your tickets here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayedTickets.map((ticket) => {
                  const event = getEventById(ticket.eventId);
                  return (
                    <div
                      key={ticket.id || ticket.bookingId}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#E8441A]/30 hover:bg-[#E8441A]/[0.02] transition-all group"
                    >
                      {/* Accent */}
                      <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#E8441A] to-[#F5A623] flex-shrink-0" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1A2E] truncate">
                          {event?.title || 'Event'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={11} /> {formatDate(event?.date)}
                          </span>
                          {ticket.ticketType && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {ticket.ticketType}
                            </span>
                          )}
                          <StatusBadge status={ticket.status || (ticket.checkedIn ? 'confirmed' : 'pending')} />
                        </div>
                        <p className="text-xs text-gray-300 font-mono mt-1">{ticket.bookingId}</p>
                      </div>

                      {/* QR */}
                      <button
                        onClick={() => setQrTicket(ticket)}
                        className="flex-shrink-0 w-14 h-14 border border-gray-200 rounded-xl p-1.5 cursor-pointer hover:border-[#E8441A] transition-colors opacity-80 group-hover:opacity-100"
                        title="View QR Code"
                      >
                        <QRCode value={ticket.bookingId || 'TICKET'} size={44} level="M" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {tickets.length > 3 && (
                <button
                  onClick={() => setShowAllTickets(s => !s)}
                  className="mt-4 w-full py-2 text-xs font-semibold text-[#E8441A] border border-[#E8441A]/30 rounded-xl hover:bg-[#E8441A]/5 transition-colors flex items-center justify-center gap-1"
                >
                  {showAllTickets
                    ? <><ChevronUp size={14} /> Show less</>
                    : <><ChevronDown size={14} /> Show all {tickets.length} tickets</>}
                </button>
              )}
            </>
          )}
        </Section>

      </div>

      {/* QR Modal */}
      <Modal isOpen={!!qrTicket} onClose={() => setQrTicket(null)} title="Ticket QR Code" size="sm">
        {qrTicket && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-4">Show this at the event entrance</p>
            <div className="inline-block p-4 bg-white border-2 border-gray-100 rounded-2xl">
              <QRCode value={qrTicket.bookingId} size={200} level="H" />
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Booking ID</p>
              <p className="font-mono font-bold text-[#1A1A2E]">{qrTicket.bookingId}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Profile;
