
import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Check, Search, Save, Camera, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ViewState } from '../types';

interface AttendanceProps {
  mode: 'MANUAL' | 'QR';
}

export const Attendance: React.FC<AttendanceProps> = ({ mode }) => {
  const [students] = useState(DataService.getStudents());
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAttendance = (id: string) => {
    const newSet = new Set(presentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setPresentIds(newSet);
  };

  const handleSubmit = () => {
    DataService.saveAttendance({
        date: new Date().toISOString(),
        presentStudentIds: Array.from(presentIds),
        mode: mode,
        totalStudents: students.length
    });
    setSubmitted(true);
  };

  const handleDownloadReport = () => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(5, 150, 105);
      doc.text('PRAVAH Daily Attendance', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);
      doc.text(`Mode: ${mode}`, 20, 42);
      doc.text(`Total Present: ${presentIds.size} / ${students.length}`, 20, 49);

      let yPos = 60;
      doc.setLineWidth(0.5);
      doc.line(20, 55, 190, 55);
      doc.setFont(undefined, 'bold');
      doc.text("Student Name", 20, yPos);
      doc.text("ID", 100, yPos);
      doc.text("Status", 160, yPos);
      doc.setFont(undefined, 'normal');

      yPos += 10;

      students.forEach((s) => {
          if (yPos > 280) {
              doc.addPage();
              yPos = 20;
          }
          doc.text(s.name, 20, yPos);
          doc.text(s.id, 100, yPos);
          doc.text(presentIds.has(s.id) ? 'Present' : 'Absent', 160, yPos);
          yPos += 10;
      });

      doc.save(`Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Real Scanner Integration
  const startScanner = () => {
    setScanning(true);
    // Use a small timeout to allow UI to render the scanner region
    setTimeout(() => {
        const config = { 
            fps: 10, 
            qrbox: 250, 
            aspectRatio: 1.0,
            // Prefer back camera environment for mobile
            videoConstraints: { facingMode: { exact: "environment" } } 
        };
        
        // Fallback config if exact environment fails (handled by lib usually, but good to be safe)
        const html5QrcodeScanner = new (window as any).Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: 250 },
            /* verbose= */ false
        );
        
        scannerRef.current = html5QrcodeScanner;
        
        html5QrcodeScanner.render((decodedText: string, decodedResult: any) => {
            // Check if scanned text matches a student ID
            const student = students.find(s => s.id === decodedText);
            if (student) {
                toggleAttendance(student.id);
                // Visual feedback via standard alert for prototype simplicity
                alert(`Marked Present: ${student.name}`);
            } else {
                console.log(`Scanned unknown code: ${decodedText}`);
            }
        }, (errorMessage: any) => {
            // parse error, ignore loop
        });
    }, 100);
  };

  const stopScanner = () => {
      if (scannerRef.current) {
          scannerRef.current.clear().catch((error: any) => console.error("Failed to clear scanner", error));
          scannerRef.current = null;
      }
      setScanning(false);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
      return () => {
          if (scannerRef.current) {
              scannerRef.current.clear().catch((error: any) => console.error("Failed to clear scanner", error));
          }
      };
  }, []);

  if (submitted) {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="p-4 bg-green-100 rounded-full">
                <Check className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-stone-800">Attendance Saved!</h2>
            <p className="text-stone-600">PDF has been generated.</p>
            <div className="flex space-x-3">
                <button onClick={handleDownloadReport} className="text-white bg-emerald-600 px-4 py-2 rounded hover:bg-emerald-700">
                    Download PDF
                </button>
                <button onClick={() => setSubmitted(false)} className="text-stone-600 font-medium px-4 py-2 border rounded hover:bg-stone-50">
                    Back to List
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 h-full flex flex-col">
      <div className="p-6 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-xl font-bold text-stone-800">
                {mode === 'QR' ? 'QR Attendance' : 'Manual Attendance'}
            </h2>
            <p className="text-sm text-stone-500">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long'})}
            </p>
        </div>
        
        {mode === 'QR' ? (
             !scanning ? (
                <button 
                    onClick={startScanner}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                    <Camera size={20} />
                    <span>Start Scanner</span>
                </button>
             ) : (
                <button 
                    onClick={stopScanner}
                    className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                    <XCircle size={20} />
                    <span>Stop Scanner</span>
                </button>
             )
        ) : (
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-stone-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by Name or ID" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
            </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2">
         {/* QR Mode visualizer */}
         {mode === 'QR' && scanning && (
             <div className="bg-stone-100 p-4 mb-4 rounded-lg">
                 <div id="reader" className="w-full max-w-sm mx-auto"></div>
                 <p className="text-center text-sm text-stone-500 mt-2">Point camera at student QR code</p>
             </div>
         )}

         <table className="w-full text-left">
             <thead className="bg-stone-50 text-stone-600 font-medium text-sm sticky top-0">
                 <tr>
                     <th className="p-4">Status</th>
                     <th className="p-4">Student Name</th>
                     <th className="p-4">ID</th>
                     <th className="p-4">Class</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-stone-100">
                 {filteredStudents.map(student => {
                     const isPresent = presentIds.has(student.id);
                     return (
                         <tr 
                            key={student.id} 
                            onClick={() => toggleAttendance(student.id)}
                            className={`cursor-pointer hover:bg-stone-50 transition-colors ${isPresent ? 'bg-emerald-50/50' : ''}`}
                         >
                             <td className="p-4">
                                 <div className={`w-6 h-6 rounded border flex items-center justify-center ${isPresent ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`}>
                                     {isPresent && <Check size={16} className="text-white" />}
                                 </div>
                             </td>
                             <td className="p-4 font-medium text-stone-800">{student.name}</td>
                             <td className="p-4 text-stone-500 font-mono text-sm">{student.id}</td>
                             <td className="p-4 text-stone-600">{student.classLevel}</td>
                         </tr>
                     );
                 })}
             </tbody>
         </table>
      </div>

      <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center">
        <div className="text-stone-600">
            Present: <span className="font-bold text-stone-900">{presentIds.size}</span> / {students.length}
        </div>
        <button 
            onClick={handleSubmit}
            disabled={presentIds.size === 0}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Save size={20} />
            <span>Submit Attendance</span>
        </button>
      </div>
    </div>
  );
};
