const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

const app = express();
app.use(express.json());

// 🔥 STORE EXISTING HASH INTO BLOCKCHAIN
app.post('/storeBlockchain', async (req, res) => {
    try {
        const { evidenceId } = req.body;

        // 1. Get data from evidence collection
        const doc = await db.collection("evidence").doc(evidenceId).get();

        if (!doc.exists) {
            return res.send({ status: "NOT FOUND" });
        }

        const data = doc.data();

        // 2. Extract ONLY required fields
        const blockchainData = {
            evidenceId: data.evidence_id,
            metadata_hash: data.metadata_hash,
            timestamp: data.created_at
        };

        // 3. Save into blockchain collection
        await db.collection("blockchain").doc(evidenceId).set(blockchainData);

        console.log("✅ Stored in blockchain:", blockchainData);

        res.send({
            status: "SUCCESS",
            blockchainData
        });

    } catch (error) {
        res.send({ status: "ERROR", message: error.message });
    }
});

app.post('/verifyEvidence', async (req, res) => {
    try {
        const { evidenceId } = req.body;

        // 1. Get evidence data from Firestore
        const evidenceDoc = await db.collection("evidence").doc(evidenceId).get();

        if (!evidenceDoc.exists) {
            return res.send({ success: false, message: "Evidence not found" });
        }

        const evidenceData = evidenceDoc.data();

        // 🔥 Extract metadata + CID
        const metadata = evidenceData.metadata;
        const cid = evidenceData.cid;

        if (!metadata || !cid) {
            return res.send({ success: false, message: "Metadata or CID missing" });
        }

        // 2. Recompute hash
        const combinedData = `metadata:${metadata}|cid:${cid}`;
        const recalculatedHash = generateHash(combinedData);

        // 3. Get blockchain stored hash
        const blockchainDoc = await db.collection("blockchain").doc(evidenceId).get();

        if (!blockchainDoc.exists) {
            return res.send({ success: false, message: "No blockchain record found" });
        }

        const blockchainData = blockchainDoc.data();
        const storedHash = blockchainData.metadata_hash;

        // 4. Compare hashes
        const isValid = recalculatedHash === storedHash;

        // 5. Send response
        res.send({
            success: true,
            evidenceId,
            status: isValid ? "VALID" : "TAMPERED",
            recalculated_hash: recalculatedHash,
            blockchain_hash: storedHash,
            metadata,
            cid
        });

    } catch (error) {
        res.send({ success: false, message: error.message });
    }
});

app.get('/', (req, res) => {
    res.send("🚀 Backend Running. Use POST APIs only.");
});
// Handle GET (browser)
app.get('/verifyEvidence', (req, res) => {
    res.send("❌ Use POST method for /verifyEvidence");
});
// Handle GET (browser)
app.get('/storeBlockchain', (req, res) => {
    res.send("❌ Use POST method for /storeBlockchain");
});


function generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// ✅ IMPORTANT (Render uses dynamic port)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});