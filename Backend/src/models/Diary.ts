import mongoose from 'mongoose';

const VolunteerEntrySchema = new mongoose.Schema({
  name: String,
  inTime: String,
  outTime: String,
  status: String,
  classHandled: String,
  subject: String,
  topic: String
});

const DiarySchema = new mongoose.Schema({
  date: { type: String, required: true },
  centerId: { type: String, required: true }, // Important for multi-center backend
  studentCount: { type: Number, required: true },
  inTime: String,
  outTime: String,
  thought: String,
  subjectTaught: String,
  topicTaught: String,
  volunteers: [VolunteerEntrySchema]
}, { timestamps: true });

export const Diary = mongoose.model('Diary', DiarySchema);