try {
  require('dotenv').config();
} catch (e) {}

const { MongoClient } = require('mongodb');

let attachDatabasePool = null;
try {
  attachDatabasePool = require('@vercel/functions').attachDatabasePool;
} catch (e) {}

const uri = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-atlas-violet-planet:OBBDUvrBjNg94CbF@atlas-violet-planet.zegnvrm.mongodb.net/Codsoft?retryWrites=true&w=majority';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);

  // Vercel Serverless Function connection pool optimization
  if (typeof attachDatabasePool === 'function') {
    try {
      attachDatabasePool(client);
    } catch (poolErr) {
      // Non-fatal if running outside Vercel function environment
    }
  }

  await client.connect();
  const db = client.db('Codsoft');

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

module.exports = async (req, res) => {
  // Polyfill Express-like helpers for local Node.js server
  if (!res.status) {
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.end(JSON.stringify(data));
      return this;
    };
  }

  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('certificates');

    // GET /api/certificates or /api/certificates?id=...
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        let cleanId = id.trim();
        try {
          cleanId = decodeURIComponent(cleanId);
        } catch (e) {}
        const alphaNum = cleanId.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Exact match on id or certificateId
        let cert = await collection.findOne(
          { $or: [{ id: cleanId }, { certificateId: cleanId }] },
          { projection: { _id: 0 } }
        );

        // 2. Partial/suffix search (e.g. "84920" or "32816")
        if (!cert && alphaNum.length >= 3) {
          const regex = new RegExp(alphaNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          cert = await collection.findOne(
            { $or: [{ id: regex }, { certificateId: regex }] },
            { projection: { _id: 0 } }
          );
        }

        if (cert) {
          return res.status(200).json({ success: true, certificate: cert });
        } else {
          return res.status(404).json({ success: false, message: 'Certificate not found in MongoDB' });
        }
      }

      // Return all certificates
      const all = await collection
        .find({}, { projection: { _id: 0 } })
        .sort({ updatedAt: -1 })
        .toArray();

      return res.status(200).json({ success: true, count: all.length, certificates: all });
    }

    // POST /api/certificates - Create or update certificate
    if (req.method === 'POST') {
      let data = req.body;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {}
      }

      const certId = data.id || data.certificateId;
      if (!certId || !data.studentName) {
        return res.status(400).json({ success: false, message: 'Certificate ID and Student Name are required' });
      }

      const certDoc = {
        id: certId,
        certificateId: certId,
        studentName: data.studentName,
        domain: data.domain || 'Internship Program',
        duration: data.duration || '4 weeks',
        startingDate: data.startingDate || '',
        awardDate: data.awardDate || '',
        credentialType: data.credentialType || 'Internship Completion Record',
        recordStatus: data.recordStatus || 'Completed',
        issuerOrganization: data.issuerOrganization || 'CodSoft (Virtual Internship Program)',
        verificationStatus: data.verificationStatus || 'Record Issued',
        recordReference: data.recordReference || `IND-REC-${Date.now().toString().slice(-6)}`,
        updatedAt: new Date()
      };

      await collection.updateOne(
        { $or: [{ id: certId }, { certificateId: certId }] },
        { $set: certDoc },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Certificate saved to MongoDB Atlas',
        certificate: certDoc
      });
    }

    // DELETE /api/certificates?id=...
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Certificate ID is required' });
      }

      await collection.deleteOne({ $or: [{ id: id }, { certificateId: id }] });
      return res.status(200).json({ success: true, message: 'Certificate deleted from MongoDB Atlas' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('MongoDB API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
