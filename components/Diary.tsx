
import React, { useState } from 'react';
import { DiaryVolunteerEntry, User } from '../types';
import { DataService } from '../services/dataService';
import { Plus, Trash2, Save, FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface DiaryProps {
    user: User;
}

export const Diary: React.FC<DiaryProps> = ({ user }) => {
  const [entry, setEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    studentCount: 0,
    inTime: '16:00',
    outTime: '18:00',
    thought: '',
    subjectTaught: '',
    topicTaught: '',
  });

  const [volunteers, setVolunteers] = useState<DiaryVolunteerEntry[]>([
    { name: '', inTime: '16:00', outTime: '18:00', status: 'Present', classHandled: '', subject: '', topic: '' }
  ]);

  const [submitted, setSubmitted] = useState(false);

  const handleVolunteerChange = (index: number, field: keyof DiaryVolunteerEntry, value: string) => {
    const updated = [...volunteers];
    updated[index] = { ...updated[index], [field]: value };
    setVolunteers(updated);
  };

  const addVolunteer = () => {
    setVolunteers([...volunteers, { name: '', inTime: '16:00', outTime: '18:00', status: 'Present', classHandled: '', subject: '', topic: '' }]);
  };

  const removeVolunteer = (index: number) => {
    setVolunteers(volunteers.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.saveDiary({
        id: Date.now().toString(),
        ...entry,
        volunteers
    });
    setSubmitted(true);
  };

  const handleDownloadPDF = () => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(234, 88, 12); // Orange
      doc.text('PRAVAH - UPAY Diary', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Center: ${user.centerName}`, 20, 35);
      doc.text(`Date: ${entry.date}`, 120, 35);
      doc.text(`Students Present: ${entry.studentCount}`, 20, 42);
      doc.text(`Timing: ${entry.inTime} - ${entry.outTime}`, 120, 42);

      doc.text(`Thought of the Day:`, 20, 52);
      doc.setFont(undefined, 'italic');
      doc.text(`"${entry.thought}"`, 20, 58);
      doc.setFont(undefined, 'normal');

      doc.text(`Subject: ${entry.subjectTaught}`, 20, 70);
      doc.text(`Topic: ${entry.topicTaught}`, 120, 70);

      doc.setFontSize(14);
      doc.text('Volunteer Logs', 20, 90);
      doc.line(20, 92, 190, 92);

      let y = 105;
      volunteers.forEach(v => {
          if (y > 270) {
              doc.addPage();
              y = 20;
          }
          doc.setFont(undefined, 'bold');
          doc.text(v.name || 'Volunteer', 20, y);
          doc.setFont(undefined, 'normal');
          doc.text(`${v.inTime} - ${v.outTime}`, 120, y);
          y += 6;
          doc.text(`Class: ${v.classHandled} | Subject: ${v.subject}`, 20, y);
          y += 6;
          doc.text(`Topic: ${v.topic}`, 20, y);
          y += 12;
      });

      doc.save(`Diary_${user.centerName}_${entry.date}.pdf`);
  };

  if (submitted) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-stone-200 text-center max-w-md">
                <FileText className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-stone-800 mb-2">Diary Logged!</h2>
                <p className="text-stone-600 mb-6">Today's operational log has been saved.</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={handleDownloadPDF} className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
                        <Download size={16} /> <span>Download PDF</span>
                    </button>
                    <button onClick={() => setSubmitted(false)} className="text-stone-600 font-semibold px-4 py-2 border rounded hover:bg-stone-50">
                        Back to Diary
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-800">UPAY Diary</h2>
          <span className="text-sm text-stone-500 bg-white px-3 py-1 rounded-full border border-stone-200">
              Daily Operational Log
          </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Center Log */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-800 mb-4 border-b border-stone-100 pb-2">Center Activities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Center Name Display */}
                <div className="md:col-span-3">
                     <label className="block text-sm font-medium text-stone-700 mb-1">Center Name</label>
                     <div className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-emerald-800 font-semibold">
                        {user.centerName}
                     </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
                    <input type="date" value={entry.date} onChange={e => setEntry({...entry, date: e.target.value})} className="w-full rounded-lg border-stone-300 shadow-sm p-2 border" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Students Present</label>
                    <input type="number" value={entry.studentCount} onChange={e => setEntry({...entry, studentCount: parseInt(e.target.value)})} className="w-full rounded-lg border-stone-300 shadow-sm p-2 border" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">In-Time</label>
                        <input type="time" value={entry.inTime} onChange={e => setEntry({...entry, inTime: e.target.value})} className="w-full rounded-lg border-stone-300 shadow-sm p-2 border" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Out-Time</label>
                        <input type="time" value={entry.outTime} onChange={e => setEntry({...entry, outTime: e.target.value})} className="w-full rounded-lg border-stone-300 shadow-sm p-2 border" required />
                    </div>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Thought of the Day</label>
                    <input type="text" value={entry.thought} onChange={e => setEntry({...entry, thought: e.target.value})} className="w-full rounded-lg border-stone-300 shadow-sm p-2 border" placeholder="e.g. Education is the most powerful weapon..." />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Subject Taught</label>
                    <input type="text" value={entry.subjectTaught} onChange={e => setEntry({...entry, subjectTaught: e.target.value})} className="w-full rounded-lg border-stone-300 shadow-sm p-2 border" required />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Topic Details</label>
                    <input type="text" value={entry.topicTaught} onChange={e => setEntry({...entry, topicTaught: e.target.value})} className="w-full rounded-lg border-stone-300 shadow-sm p-2 border" required />
                </div>
            </div>
        </div>

        {/* Volunteer Log */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-2">
                <h3 className="text-lg font-semibold text-stone-800">Volunteer Log</h3>
                <button type="button" onClick={addVolunteer} className="text-sm text-emerald-600 font-medium flex items-center hover:text-emerald-700">
                    <Plus size={16} className="mr-1" /> Add Volunteer
                </button>
            </div>
            
            <div className="space-y-4">
                {volunteers.map((vol, idx) => (
                    <div key={idx} className="bg-stone-50 p-4 rounded-lg border border-stone-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end relative group">
                        <div className="md:col-span-3">
                            <label className="text-xs text-stone-500 block mb-1">Volunteer Name</label>
                            <input type="text" value={vol.name} onChange={e => handleVolunteerChange(idx, 'name', e.target.value)} className="w-full p-2 rounded border border-stone-300 text-sm" placeholder="Name" required />
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-xs text-stone-500 block mb-1">Status</label>
                             <select value={vol.status} onChange={e => handleVolunteerChange(idx, 'status', e.target.value as any)} className="w-full p-2 rounded border border-stone-300 text-sm">
                                <option>Present</option>
                                <option>Absent</option>
                             </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-xs text-stone-500 block mb-1">Class</label>
                             <input type="text" value={vol.classHandled} onChange={e => handleVolunteerChange(idx, 'classHandled', e.target.value)} className="w-full p-2 rounded border border-stone-300 text-sm" placeholder="e.g. 5th" />
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-xs text-stone-500 block mb-1">Subject</label>
                             <input type="text" value={vol.subject} onChange={e => handleVolunteerChange(idx, 'subject', e.target.value)} className="w-full p-2 rounded border border-stone-300 text-sm" placeholder="Subject" />
                        </div>
                        <div className="md:col-span-3">
                             <label className="text-xs text-stone-500 block mb-1">Topic Taught</label>
                             <input type="text" value={vol.topic} onChange={e => handleVolunteerChange(idx, 'topic', e.target.value)} className="w-full p-2 rounded border border-stone-300 text-sm" placeholder="Topic details" />
                        </div>
                        
                        {volunteers.length > 1 && (
                            <button 
                                type="button" 
                                onClick={() => removeVolunteer(idx)} 
                                className="absolute -top-2 -right-2 bg-white text-red-500 shadow-sm p-1 rounded-full hover:bg-red-50 md:static md:bg-transparent md:shadow-none md:mb-2"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <button type="submit" className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 shadow-md flex items-center space-x-2">
                <Save size={20} />
                <span>Save Diary Entry</span>
            </button>
        </div>
      </form>
    </div>
  );
};
