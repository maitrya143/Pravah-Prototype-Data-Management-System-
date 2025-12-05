
import React, { useState } from 'react';
import { Student, User } from '../types';
import { DataService } from '../services/dataService';
import { Download, CheckCircle, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AdmissionProps {
    user: User;
}

export const Admission: React.FC<AdmissionProps> = ({ user }) => {
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    age: '',
    classLevel: '',
    schoolName: '',
    parentName: '',
    parentOccupation: '',
    aadhaar: '',
    contact: '',
    registrationNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent = DataService.addStudent({
      ...formData,
      age: parseInt(formData.age) || 0,
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      admissionDate: new Date().toISOString().split('T')[0],
      // id, centerId will be handled by service
    } as any, user);
    
    setCreatedStudent(newStudent);
    setStep('SUCCESS');
  };

  const handleDownload = () => {
    if (!createdStudent) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // Emerald 600
    doc.text('PRAVAH Admission Form', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('The Flow of Change', 105, 26, { align: 'center' });

    // Center Info
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Center: ${user.centerName} (${user.centerId})`, 20, 35);

    // Student Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Student Details', 20, 45);
    doc.setLineWidth(0.5);
    doc.line(20, 47, 190, 47);

    doc.setFontSize(12);
    doc.text(`Student ID: ${createdStudent.id}`, 20, 58);
    doc.text(`Name: ${createdStudent.name}`, 20, 68);
    doc.text(`Gender: ${createdStudent.gender}`, 120, 68);
    doc.text(`DOB: ${createdStudent.dob} (Age: ${createdStudent.age})`, 20, 78);
    doc.text(`Class: ${createdStudent.classLevel}`, 120, 78);
    doc.text(`School: ${createdStudent.schoolName}`, 20, 88);

    // Parent Info
    doc.setFontSize(14);
    doc.text('Guardian Details', 20, 108);
    doc.line(20, 110, 190, 110);

    doc.setFontSize(12);
    doc.text(`Guardian: ${createdStudent.parentName}`, 20, 123);
    doc.text(`Occupation: ${createdStudent.parentOccupation}`, 120, 123);
    doc.text(`Contact: ${createdStudent.contact}`, 20, 133);
    doc.text(`Aadhaar: ${createdStudent.aadhaar}`, 120, 133);

    // QR Code
    doc.setFontSize(14);
    doc.text('Identity QR Code', 20, 158);
    doc.line(20, 160, 190, 160);
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${createdStudent.id}`;
    doc.addImage(qrUrl, 'JPEG', 80, 175, 50, 50);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Scan this QR code for daily attendance', 105, 235, { align: 'center' });

    doc.save(`PRAVAH_Admission_${createdStudent.id}.pdf`);
  };

  const resetForm = () => {
    setFormData({
      name: '', gender: 'Male', dob: '', age: '', classLevel: '', 
      schoolName: '', parentName: '', parentOccupation: '', 
      aadhaar: '', contact: '', registrationNumber: ''
    });
    setStep('FORM');
  };

  if (step === 'SUCCESS' && createdStudent) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${createdStudent.id}`;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Admission Successful!</h2>
          <p className="text-stone-500 mt-2">Student ID: <span className="font-mono font-bold text-stone-900">{createdStudent.id}</span></p>
        </div>
        
        {/* Real QR Code */}
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200">
            <div className="flex justify-center mb-4">
               <img src={qrUrl} alt="Student QR Code" className="w-48 h-48 border-4 border-white shadow-sm" />
            </div>
            <p className="text-sm font-medium text-stone-600">Scan to mark attendance</p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button 
                onClick={handleDownload}
                className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
                <Download size={20} />
                <span>Download PDF & QR</span>
            </button>
            <button 
                onClick={resetForm}
                className="flex items-center justify-center space-x-2 bg-stone-100 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-200 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>New Admission</span>
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="bg-emerald-50 px-8 py-6 border-b border-emerald-100">
        <h2 className="text-xl font-bold text-stone-800">New Admission Form</h2>
        <p className="text-sm text-stone-600">Enter student details accurately.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* Center Info Read Only */}
        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Center Name</label>
            <div className="text-lg font-semibold text-emerald-800">{user.centerName}</div>
        </div>

        {/* Student Info */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4 pb-2 border-b border-stone-100">Student Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Date of Birth</label>
                <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Age</label>
                <input required type="number" name="age" value={formData.age} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Class</label>
                <input required type="text" name="classLevel" value={formData.classLevel} onChange={handleChange} placeholder="e.g. 5th" className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">School Name</label>
                <input required type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
          </div>
        </div>

        {/* Parent Info */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4 pb-2 border-b border-stone-100">Guardian Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Father/Guardian Name</label>
                <input required type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Occupation</label>
                <input required type="text" name="parentOccupation" value={formData.parentOccupation} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Aadhaar Number</label>
                <input required type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Number</label>
                <input required type="tel" name="contact" value={formData.contact} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
          </div>
        </div>

        {/* Office Use */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4 pb-2 border-b border-stone-100">Office Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Registration No.</label>
                <input required type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Upload Form Image</label>
                <input type="file" className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            </div>
          </div>
        </div>

        <div className="pt-6">
            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
                Register Student
            </button>
        </div>
      </form>
    </div>
  );
};
