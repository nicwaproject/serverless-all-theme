import mongoose from 'mongoose';

// Cached connection
let conn = null;

// Schema
const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  attendance: {
    type: String,
    enum: ['Hadir', 'Tidak Hadir', 'Insyaallah', 'Ragu', ''],
    default: ''
  },
  coupleId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default async function handler(req, res) {
  // Tambah header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Koneksi Mongo
  if (!conn) {
    conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  // Model
  const Message = mongoose.models.Message || mongoose.model('Message', messageSchema, 'allTheme1');

  if (req.method === 'POST') {
    const { name, message, coupleId, attendance } = req.body;

    if (!name || !message || !coupleId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const newMessage = new Message({ name, message, coupleId, attendance });

    try {
      await newMessage.save();
      return res.status(200).json({ status: 'Message saved successfully!' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save message.' });
    }

  } else if (req.method === 'GET') {
    const { coupleId, theme } = req.query;

    if (!coupleId) {
      return res.status(400).json({ error: 'coupleId is required.' });
    }

    try {
      const messages = await Message.find({ coupleId }).sort({ createdAt: -1 });

      if (theme === '2' || theme === '3') {
        const hadir = messages.filter(m => m.attendance === 'Hadir').length;
        const tidakHadir = messages.filter(m => m.attendance === 'Tidak Hadir').length;
        const insyaallah = messages.filter(m => m.attendance === 'Insyaallah').length;
        const ragu = messages.filter(m => m.attendance === 'Ragu').length;

        return res.status(200).json({
          hadir,
          tidakHadir,
          insyaallah,
          ragu,
          messages: messages.map(m => ({
            name: m.name,
            message: m.message,
            attendance: m.attendance,
            createdAt: m.createdAt
          }))
        });
      } else {
        return res.status(200).json(
          messages.map(m => ({
            name: m.name,
            message: m.message,
            attendance: m.attendance,
            createdAt: m.createdAt
          }))
        );
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch messages.' });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed.' });
  }
}
