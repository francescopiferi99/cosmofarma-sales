import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { read, utils } from 'xlsx';
import fs from 'fs';

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

async function importExcel() {
    console.log("Reading Excel file...");
    const fileBuffer = fs.readFileSync("Cosmofarma_espositori.xlsx");
    const workbook = read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(sheet);

    const companiesCol = collection(db, "companies");

    console.log(`Preparing to import ${data.length} companies from Excel...`);

    let added = 0;
    let skipped = 0;

    for (const item of data) {
        const empresa = item.ESPOSITORE;
        if (!empresa) continue;

        const nomeAzienda = empresa.toUpperCase();
        
        // Check if exists
        const q = query(companiesCol, where("azienda", "==", nomeAzienda));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            skipped++;
            continue;
        }

        const companyData = {
            azienda: nomeAzienda,
            pad: item.PADIGLIONE ? String(item.PADIGLIONE).replace("Pad. ", "") : "-",
            omaggio: "-",
            contatto: "-",
            stato: "IN ATTESA"
        };

        try {
            await addDoc(companiesCol, companyData);
            added++;
            if (added % 10 === 0) {
                console.log(`Added ${added} companies...`);
            }
        } catch (error) {
            console.error(`Error adding ${nomeAzienda}:`, error);
            if (error.code === 'permission-denied') {
                console.log("\n!!! PERMISSION DENIED !!!");
                console.log("The Firestore Security Rules are likely blocking this script.");
                console.log("Since I cannot log in as a user via the script, you might need to run this in the Browser Console of your website.");
                return;
            }
            return;
        }
    }

    console.log(`Import finished. Added: ${added}, Skipped: ${skipped}`);
}

importExcel();
