const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,  }),
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
            return res.send({ success: false, message: "Evidence not found" });
        }

        const data = doc.data();

        // 🔥 Extract required fields
        const metadata = data.metadata;
        const metadataHash = data.metadata_hash;

        if (!metadata || !metadataHash) {
            return res.send({
                success: false,
                message: "Metadata or hash missing"
            });
        }

        // 2. Prepare blockchain data (UPDATED)
        const blockchainData = {
            evidenceId: evidenceId,        // ✅ correct
            metadata: metadata,            // ✅ added
            metadata_hash: metadataHash    // ✅ correct
        };

        // 3. Save into blockchain collection
        await db.collection("blockchain")
                .doc(evidenceId)
                .set(blockchainData);

        console.log("✅ Stored in blockchain:", blockchainData);

        res.send({
            success: true,
            message: "Stored on blockchain",
            blockchainData
        });

    } catch (error) {
        console.error("STORE ERROR:", error);

        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});
app.post('/verifyEvidence', async (req, res) => {
    try {
        const { evidenceId } = req.body;

        // ✅ Validate input
        if (!evidenceId) {
            return res.status(400).json({
                success: false,
                message: "evidenceId is required"
            });
        }

        console.log("Evidence ID:", evidenceId);

        // ✅ 1. Get evidence from Firestore (FIXED QUERY)
        const evidenceSnapshot = await db.collection("evidence")
            .where("evidence_id", "==", evidenceId)
            .get();

        if (evidenceSnapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "Evidence not found"
            });
        }

        const evidenceData = evidenceSnapshot.docs[0].data();

        console.log("Firebase Data:", evidenceData);

        // 🔥 Extract metadata + CID
        const metadata = evidenceData.metadata;
        const cid = evidenceData.file_cid;

        if (!metadata || !cid) {
            return res.status(400).json({
                success: false,
                message: "Metadata or CID missing"
            });
        }

        // ✅ 2. Recompute hash
        const combinedData = `metadata:${metadata}|cid:${cid}`;
        const recalculatedHash = generateHash(combinedData);

        // ✅ 3. Get blockchain stored hash (FIXED QUERY)
        const blockchainSnapshot = await db.collection("blockchain")
            .where("evidence_id", "==", evidenceId)
            .get();

        if (blockchainSnapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "No blockchain record found"
            });
        }

        const blockchainData = blockchainSnapshot.docs[0].data();
        const storedHash = blockchainData.metadata_hash;

        // ✅ 4. Compare hashes
        const isValid = recalculatedHash === storedHash;

        // ✅ 5. Send response (ONLY ONCE)
        return res.json({
            success: true,
            evidenceId,
            status: isValid ? "VALID" : "TAMPERED",
            recalculated_hash: recalculatedHash,
            blockchain_hash: storedHash,
            metadata,
            cid
        });

    } catch (error) {
        console.error("VERIFY ERROR:", error);

        // ✅ Only ONE response in catch
        return res.status(500).json({
            success: false,
            message: error.message
        });
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