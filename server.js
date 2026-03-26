const express = require('express');
const admin = require('firebase-admin');

// Firebase setup
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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

// 🔍 VERIFY TAMPER-PROOF
app.post('/verifyEvidence', async (req, res) => {
    try {
        const { evidenceId } = req.body;

        // 1. Get original data
        const evidenceDoc = await db.collection("evidence").doc(evidenceId).get();

        if (!evidenceDoc.exists) {
            return res.send({ status: "NOT FOUND" });
        }

        const evidenceData = evidenceDoc.data();

        // 2. Get blockchain data
        const blockchainDoc = await db.collection("blockchain").doc(evidenceId).get();

        if (!blockchainDoc.exists) {
            return res.send({ status: "NO BLOCKCHAIN RECORD" });
        }

        const blockchainData = blockchainDoc.data();

        // 3. Compare hashes
        const isValid = evidenceData.metadata_hash === blockchainData.metadata_hash;

        // 4. Result
        res.send({
            evidenceId,
            result: isValid ? "TAMPER-PROOF ✅" : "TAMPERED ❌",
            firestore_hash: evidenceData.metadata_hash,
            blockchain_hash: blockchainData.metadata_hash
        });

    } catch (error) {
        res.send({ status: "ERROR", message: error.message });
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

// ✅ IMPORTANT (Render uses dynamic port)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});