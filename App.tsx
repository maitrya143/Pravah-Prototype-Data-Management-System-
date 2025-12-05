
import React, { useState } from 'react';
import { ViewState, User, CityCode } from './types';
import { CITIES, CENTERS, LOGO_URL, PRIMARY_SYLLABUS } from './constants';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Admission } from './components/Admission';
import { Attendance } from './components/Attendance';
import { Diary } from './components/Diary';
import { StudentQR } from './components/StudentQR';
import { Syllabus } from './components/Syllabus'; // Import
import { DataService } from './services/dataService';
import { Download, FileText, ArrowRight, UserPlus, AlertCircle, Loader2, Edit2, Lock, Trash2, AlertTriangle, Filter, MessageSquare } from 'lucide-react';
import { jsPDF } from 'jspdf';

// --- Reusable UI Components ---

interface FloatingInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ 
  id, label, value, onChange, type = "text", required, helperText, placeholder 
}) => (
  <div className="relative mb-1">
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      className="peer block w-full appearance-none rounded-xl border border-stone-200 bg-stone-50/50 px-4 pt-5 pb-2.5 text-stone-800 shadow-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-transparent"
      placeholder={placeholder || label}
      required={required}
    />
    <label
      htmlFor={id}
      className="absolute left-4 top-3.5 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-stone-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-emerald-600 cursor-text pointer-events-none"
    >
      {label}
    </label>
    {helperText && <p className="text-xs text-stone-400 mt-1.5 ml-1">{helperText}</p>}
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Registration State
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');

  // Center Selection State
  const [availableCenters, setAvailableCenters] = useState<{id: string, name: string}[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [tempUserName, setTempUserName] = useState('');

  // Settings State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // History State
  const [historyVersion, setHistoryVersion] = useState(0); // Force re-render
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'Admission' | 'Attendance' | 'Diary'>('ALL');
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, type: string}>({
    isOpen: false, id: '', type: ''
  });

  // --- Auth Flow Helpers ---

  // Helper to extract city code flexibly from string
  const extractCityCode = (id: string): CityCode | null => {
    const match = id.toUpperCase().match(/(MDA|NGP)/);
    return match ? (match[0] as CityCode) : null;
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // 1. Basic Validation
      if (!regId || !regName || !regPass) {
        setError("All fields are required.");
        setIsLoading(false);
        return;
      }
      
      if (regId.length < 5) {
        setError("Volunteer ID is too short (min 5 characters).");
        setIsLoading(false);
        return;
      }

      // 2. City Code check (flexible regex)
      const cityCode = extractCityCode(regId);
      if (!cityCode) {
        setError("Volunteer ID must contain a valid City Code (MDA or NGP).");
        setIsLoading(false);
        return;
      }

      // 3. Attempt Registration
      const result = DataService.registerUser(regId, regName, regPass);
      
      setIsLoading(false);

      if (result.success) {
          alert("Registration Successful! Please login.");
          setRegId('');
          setRegName('');
          setRegPass('');
          setError('');
          setView('LOGIN');
      } else {
          setError(result.message || "Registration failed.");
      }
  };

  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // 1. Authenticate
    const authResult = DataService.authenticate(loginId, loginPass);
    
    if (!authResult.success) {
        setIsLoading(false);
        setError(authResult.message || "Authentication failed");
        return;
    }

    // 2. Extract City Code
    const cityCode = extractCityCode(loginId);
    if (!cityCode) {
      setIsLoading(false);
      setError("City code not recognized in ID. Please contact admin.");
      return;
    }

    // 3. Load Centers for that City
    const centers = CENTERS.filter(c => c.cityCode === cityCode);
    if (centers.length === 0) {
        setIsLoading(false);
        setError("No centers found for this city code.");
        return;
    }

    setAvailableCenters(centers);
    setTempUserName(authResult.user?.name || 'Volunteer');
    setIsLoading(false);
    setView('CENTER_SELECT');
  };

  const handleCenterSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenterId) return;

    const center = CENTERS.find(c => c.id === selectedCenterId);
    
    // Create Session User
    const newUser: User = {
      volunteerId: loginId,
      name: tempUserName, 
      centerId: selectedCenterId,
      centerName: center?.name || ''
    };
    
    setUser(newUser);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    setLoginId('');
    setLoginPass('');
    setTempUserName('');
    setError('');
    setView('LOGIN');
  };

  const switchToRegister = () => {
      setError('');
      setView('REGISTER');
  };

  const switchToLogin = () => {
      setError('');
      setView('LOGIN');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newName) return;
      
      const result = DataService.updateUser(user.volunteerId, { name: newName });
      if (result.success && result.user) {
          setUser({ ...user, name: result.user.name });
          alert('Profile Updated Successfully');
          setShowEditProfile(false);
      } else {
          alert('Failed to update profile');
      }
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newPass) return;
      
      const result = DataService.updateUser(user.volunteerId, { password: newPass });
      if (result.success) {
          alert('Password Changed Successfully');
          setShowChangePass(false);
          setNewPass('');
      } else {
          alert('Failed to update password');
      }
  };
  
  const handleFeedbackSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !feedbackSubject || !feedbackMessage) return;

      DataService.saveFeedback({
          volunteerId: user.volunteerId,
          volunteerName: user.name,
          centerId: user.centerId,
          subject: feedbackSubject,
          message: feedbackMessage
      });

      alert('Feedback submitted successfully!');
      setShowFeedback(false);
      setFeedbackSubject('');
      setFeedbackMessage('');
  };

  // --- Delete Modal Logic ---
  const requestDelete = (id: string, type: string) => {
      setDeleteModal({ isOpen: true, id, type });
  };

  const confirmDelete = () => {
      if (deleteModal.id && deleteModal.type) {
          DataService.deleteHistoryItem(deleteModal.id, deleteModal.type);
          setHistoryVersion(prev => prev + 1); // Trigger re-render of list
      }
      setDeleteModal({ isOpen: false, id: '', type: '' });
  };

  // --- Render Views ---

  const renderRegister = () => (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-100 animate-fade-in">
        <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
                {!logoError ? (
                    <img 
                        src={LOGO_URL} 
                        alt="Pravah Logo" 
                        className="h-24 w-auto object-contain" 
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-emerald-800 tracking-tight">Pravah</span>
                        <span className="text-sm text-stone-500 tracking-wide uppercase mt-1">The Flow of Change</span>
                    </div>
                )}
            </div>
            <h1 className="text-2xl font-bold text-stone-800">Create Account</h1>
            <p className="text-stone-500 mt-1">Register as a Center Head</p>
        </div>

        {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
            <FloatingInput 
              id="reg-id"
              label="Volunteer ID"
              value={regId}
              onChange={(e) => setRegId(e.target.value.toUpperCase())}
              helperText="Must contain 'MDA' or 'NGP' (e.g. 25MDA177)"
              required
            />
            <FloatingInput 
              id="reg-name"
              label="Full Name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
            />
            <FloatingInput 
              id="reg-pass"
              label="Password"
              type="password"
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
              required
            />
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-2 transform active:scale-[0.98] flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Creating Account...
                </>
              ) : (
                "Register Account"
              )}
            </button>
            <div className="text-center mt-6">
                <span className="text-stone-500 text-sm">Already have an account? </span>
                <button 
                    type="button" 
                    onClick={switchToLogin} 
                    disabled={isLoading}
                    className="text-emerald-600 font-semibold text-sm hover:underline disabled:opacity-50"
                >
                    Login here
                </button>
            </div>
        </form>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-100 animate-fade-in">
        <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
                {!logoError ? (
                    <img 
                        src={LOGO_URL} 
                        alt="Pravah Logo" 
                        className="h-24 w-auto object-contain" 
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-emerald-800 tracking-tight">Pravah</span>
                        <span className="text-sm text-stone-500 tracking-wide uppercase mt-1">The Flow of Change</span>
                    </div>
                )}
            </div>
            <h1 className="text-2xl font-bold text-stone-800">Welcome Back</h1>
            <p className="text-stone-500 mt-1">Sign in to PRAVAH</p>
        </div>

        {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleLoginStep1} className="space-y-5">
            <FloatingInput 
              id="login-id"
              label="Volunteer ID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value.toUpperCase())}
              helperText="e.g. 25MDA177"
              required
            />
            <FloatingInput 
              id="login-pass"
              label="Password"
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              required
            />
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-2 transform active:scale-[0.98] flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Verifying...
                </>
              ) : (
                "Secure Login"
              )}
            </button>
            <div className="text-center pt-4">
                <span className="text-stone-500 text-sm">New volunteer? </span>
                <button 
                    type="button" 
                    onClick={switchToRegister} 
                    disabled={isLoading}
                    className="text-emerald-600 font-semibold text-sm hover:underline disabled:opacity-50"
                >
                    Register here
                </button>
            </div>
        </form>
      </div>
    </div>
  );

  const renderCenterSelect = () => (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-100 animate-fade-in">
        <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
                 {!logoError ? (
                    <img 
                        src={LOGO_URL} 
                        alt="Pravah Logo" 
                        className="h-16 w-auto object-contain" 
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-emerald-800">Pravah</span>
                    </div>
                )}
            </div>
            <h2 className="text-xl font-bold text-stone-800">Select Center</h2>
            <p className="text-stone-500">Welcome, {tempUserName}</p>
            <p className="text-xs text-stone-400 mt-1">Detected City: {CITIES[extractCityCode(loginId) as CityCode]}</p>
        </div>
        <form onSubmit={handleCenterSelect} className="space-y-6">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {availableCenters.map(center => (
                    <label key={center.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedCenterId === center.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-stone-200 hover:bg-stone-50'}`}>
                        <input 
                            type="radio" 
                            name="center" 
                            value={center.id}
                            checked={selectedCenterId === center.id}
                            onChange={(e) => setSelectedCenterId(e.target.value)}
                            className="text-emerald-600 focus:ring-emerald-500 h-5 w-5"
                        />
                        <span className="ml-3 font-medium text-stone-700">{center.name}</span>
                    </label>
                ))}
            </div>
            <button 
                type="submit" 
                disabled={!selectedCenterId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center"
            >
                Enter Dashboard <ArrowRight size={18} className="ml-2" />
            </button>
            <button 
                type="button" 
                onClick={switchToLogin} 
                className="w-full text-stone-500 text-sm hover:underline mt-2"
            >
                Back to Login
            </button>
        </form>
      </div>
    </div>
  );

  // --- Main Content Switcher ---

  const renderContent = () => {
    switch (view) {
      case 'DASHBOARD':
        return <Dashboard onNavigate={setView} />;
      case 'ADMISSION':
        return <Admission user={user!} />;
      case 'GENERATE_QR':
        return <StudentQR user={user!} />;
      case 'MANUAL_ATTENDANCE':
        return <Attendance mode="MANUAL" />;
      case 'QR_SCAN':
        return <Attendance mode="QR" />;
      case 'DIARY':
        return <Diary user={user!} />;
      case 'HISTORY':
        const historyData = DataService.getAllHistory();
        
        // Filter Logic
        const filteredHistory = historyFilter === 'ALL' 
            ? historyData 
            : historyData.filter(item => item.type === historyFilter);

        const handleHistoryDownload = (item: any) => {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(`PRAVAH History - ${item.type}`, 20, 20);
            doc.setFontSize(12);
            doc.text(`Date: ${item.date}`, 20, 30);
            doc.text(`Details: ${item.details}`, 20, 40);
            doc.text(JSON.stringify(item.data, null, 2), 20, 50);
            doc.save(`${item.type}_${item.date}.pdf`);
        };

        return (
            <div className="space-y-6 animate-fade-in relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-stone-800">History & Records</h2>
                    
                    {/* Filter Controls */}
                    <div className="flex bg-white p-1 rounded-lg border border-stone-200 shadow-sm overflow-x-auto">
                        {['ALL', 'Admission', 'Attendance', 'Diary'].map(type => (
                            <button
                                key={type}
                                onClick={() => setHistoryFilter(type as any)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                    historyFilter === type 
                                        ? 'bg-emerald-100 text-emerald-800 shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                                }`}
                            >
                                {type === 'ALL' ? 'All' : type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-4 border-b border-stone-200 bg-stone-50 font-medium grid grid-cols-4 gap-4">
                        <span className="col-span-1">Date</span>
                        <span className="col-span-1">Type</span>
                        <span className="col-span-1">Details</span>
                        <span className="col-span-1 text-right">Actions</span>
                    </div>
                    <div className="divide-y divide-stone-100 max-h-[70vh] overflow-y-auto">
                        {filteredHistory.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center text-stone-500">
                                <Filter className="mb-3 text-stone-300" size={48} />
                                <p>No records found for this filter.</p>
                            </div>
                        ) : (
                            filteredHistory.map((item, idx) => (
                                <div key={item.id + idx} className="p-4 grid grid-cols-4 gap-4 items-center hover:bg-stone-50 transition-colors">
                                    <span className="text-sm text-stone-600">{item.date}</span>
                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit whitespace-nowrap ${
                                        item.type === 'Admission' ? 'bg-green-100 text-green-800' :
                                        item.type === 'Attendance' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                        {item.type}
                                    </span>
                                    <span className="text-sm text-stone-600 truncate" title={item.details}>{item.details}</span>
                                    <div className="flex justify-end space-x-3">
                                        <button 
                                            onClick={() => handleHistoryDownload(item)}
                                            className="text-stone-400 hover:text-emerald-600 transition-colors"
                                            title="Download PDF"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button 
                                            onClick={() => requestDelete(item.id, item.type)}
                                            className="text-stone-400 hover:text-red-500 transition-colors"
                                            title="Delete Record"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Custom Delete Confirmation Modal */}
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-stone-800">Delete Record?</h3>
                                <p className="text-stone-500">
                                    Are you sure you want to delete this {deleteModal.type} record? This action cannot be undone.
                                </p>
                                <div className="flex items-center space-x-3 w-full pt-2">
                                    <button 
                                        onClick={() => setDeleteModal({isOpen: false, id: '', type: ''})}
                                        className="flex-1 px-4 py-2.5 bg-stone-100 text-stone-700 font-medium rounded-xl hover:bg-stone-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmDelete}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
      case 'SYLLABUS':
        return <Syllabus user={user!} />;
      case 'PERFORMANCE':
         return (
             <div className="space-y-6 animate-fade-in">
                 <h2 className="text-2xl font-bold text-stone-800">Center Performance</h2>
                 <p className="text-stone-600">Detailed analytics coming soon. Please refer to the Dashboard for current week stats.</p>
                 <button onClick={() => setView('DASHBOARD')} className="text-emerald-600 font-medium hover:underline">Back to Dashboard</button>
             </div>
         );
      case 'SETTINGS':
        return (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-stone-800">Settings</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
                    <div className="flex items-center space-x-4 pb-4 border-b border-stone-100">
                        <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center text-stone-600">
                            <span className="text-xl font-bold">{user?.name[0]}</span>
                        </div>
                        <div>
                            <p className="font-bold text-stone-800">{user?.name}</p>
                            <p className="text-sm text-stone-500">ID: {user?.volunteerId}</p>
                        </div>
                    </div>
                    
                    {/* Edit Profile */}
                    {!showEditProfile ? (
                        <button 
                            onClick={() => { setShowEditProfile(true); setNewName(user?.name || ''); }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-stone-50 rounded-lg text-stone-700 transition-colors"
                        >
                            <Edit2 size={18} />
                            <span>Edit Profile</span>
                        </button>
                    ) : (
                        <form onSubmit={handleUpdateProfile} className="bg-stone-50 p-4 rounded-lg space-y-3">
                            <label className="block text-sm font-medium text-stone-700">Update Name</label>
                            <input 
                                type="text" 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                            <div className="flex space-x-2">
                                <button type="submit" className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">Save</button>
                                <button type="button" onClick={() => setShowEditProfile(false)} className="bg-stone-200 text-stone-700 px-3 py-1 rounded text-sm">Cancel</button>
                            </div>
                        </form>
                    )}

                    {/* Change Password */}
                    {!showChangePass ? (
                        <button 
                            onClick={() => setShowChangePass(true)}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-stone-50 rounded-lg text-stone-700 transition-colors"
                        >
                            <Lock size={18} />
                            <span>Change Password</span>
                        </button>
                    ) : (
                        <form onSubmit={handleChangePassword} className="bg-stone-50 p-4 rounded-lg space-y-3">
                            <label className="block text-sm font-medium text-stone-700">New Password</label>
                            <input 
                                type="password" 
                                value={newPass} 
                                onChange={(e) => setNewPass(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                            <div className="flex space-x-2">
                                <button type="submit" className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">Save</button>
                                <button type="button" onClick={() => setShowChangePass(false)} className="bg-stone-200 text-stone-700 px-3 py-1 rounded text-sm">Cancel</button>
                            </div>
                        </form>
                    )}

                    {/* Feedback Section */}
                    {!showFeedback ? (
                        <button 
                            onClick={() => setShowFeedback(true)}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-stone-50 rounded-lg text-stone-700 transition-colors"
                        >
                            <MessageSquare size={18} />
                            <span>Send Feedback</span>
                        </button>
                    ) : (
                        <form onSubmit={handleFeedbackSubmit} className="bg-stone-50 p-4 rounded-lg space-y-3">
                            <label className="block text-sm font-medium text-stone-700">Subject</label>
                            <input 
                                type="text" 
                                value={feedbackSubject} 
                                onChange={(e) => setFeedbackSubject(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="e.g. App Issue, Suggestion..."
                                required
                            />
                            <label className="block text-sm font-medium text-stone-700">Message</label>
                            <textarea 
                                value={feedbackMessage} 
                                onChange={(e) => setFeedbackMessage(e.target.value)}
                                className="w-full p-2 border rounded h-24 resize-none"
                                placeholder="Type your feedback here..."
                                required
                            />
                            <div className="flex space-x-2">
                                <button type="submit" className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">Submit</button>
                                <button type="button" onClick={() => setShowFeedback(false)} className="bg-stone-200 text-stone-700 px-3 py-1 rounded text-sm">Cancel</button>
                            </div>
                        </form>
                    )}

                    <button className="w-full text-left px-4 py-3 hover:bg-stone-50 rounded-lg text-stone-400 cursor-not-allowed">Switch Center (Coming Soon)</button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg text-red-600 font-medium">Logout</button>
                </div>
            </div>
        );
      default:
        return <div>View Not Found</div>;
    }
  };

  if (view === 'LOGIN') return renderLogin();
  if (view === 'REGISTER') return renderRegister();
  if (view === 'CENTER_SELECT') return renderCenterSelect();

  return (
    <Layout 
      user={user!} 
      currentView={view} 
      onNavigate={setView}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
