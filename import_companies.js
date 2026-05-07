import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
    apiKey: "AIzaSyBHssUiKjlG7CFrAiopQuzHQz8gROxDlk0",
    authDomain: "cosmofarma-sales.firebaseapp.com",
    projectId: "cosmofarma-sales",
    storageBucket: "cosmofarma-sales.firebasestorage.app",
    messagingSenderId: "762192543787",
    appId: "1:762192543787:web:952cbee9da311a2fc72a6e",
    measurementId: "G-1CRJTM1Q3Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importData() {
    const data = JSON.parse(fs.readFileSync("companies.json", "utf8"));
    const companiesCol = collection(db, "companies");

    console.log(`Starting import of ${data.length} companies...`);

    // Fetch existing companies to avoid duplicates
    const existingCompanies = new Set();
    const snapshot = await getDocs(companiesCol);
    snapshot.forEach(doc => {
        existingCompanies.add(doc.data().azienda.toUpperCase());
    });

    let added = 0;
    let skipped = 0;

    for (const item of data) {
        if (existingCompanies.has(item.azienda.toUpperCase())) {
            skipped++;
            continue;
        }

        try {
            await addDoc(companiesCol, item);
            added++;
            if (added % 50 === 0) {
                console.log(`Added ${added} companies...`);
            }
        } catch (error) {
            console.error(`Error adding ${item.azienda}:`, error);
            console.log("Stopping import due to error. You might need to be authenticated.");
            return;
        }
    }

    console.log(`Import finished. Added: ${added}, Skipped: ${skipped}`);
}

importData();
