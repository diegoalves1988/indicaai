const { initializeApp } = require("firebase/app");
const { collection, getDocs, getFirestore, updateDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDH0uEw-Ml-66pUEHF1MWED7TbuhRIWHQ0",
  authDomain: "service-recommendation-app.firebaseapp.com",
  projectId: "service-recommendation-app",
  storageBucket: "service-recommendation-app.firebasestorage.app",
  messagingSenderId: "859975350986",
  appId: "1:859975350986:web:830f7e110142f053041233",
};

const centers = [
  {
    city: "Feira de Santana",
    state: "BA",
    latitude: -12.2664,
    longitude: -38.9663,
    weight: 0.75,
  },
  {
    city: "Salvador",
    state: "BA",
    latitude: -12.9718,
    longitude: -38.5011,
    weight: 0.15,
  },
  {
    city: "Santo Estevao",
    state: "BA",
    latitude: -12.4303,
    longitude: -39.2514,
    weight: 0.05,
  },
  {
    city: "Serrinha",
    state: "BA",
    latitude: -11.6646,
    longitude: -39.0075,
    weight: 0.05,
  },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const includeAllUsers = args.has("--all-users");
const includeAllProfessionals = args.has("--all-professionals");
const maxRadiusKmArg = process.argv.find((arg) => arg.startsWith("--radius="));
const maxRadiusKm = maxRadiusKmArg ? Number(maxRadiusKmArg.split("=")[1]) : 20;

const weightedPick = (items) => {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const target = Math.random() * total;
  let acc = 0;
  for (const item of items) {
    acc += item.weight;
    if (target <= acc) {
      return item;
    }
  }
  return items[items.length - 1];
};

const randomPointNear = (center, radiusKm) => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radiusKm;

  const deltaLat = (distance / 111.32) * Math.cos(angle);
  const deltaLon =
    (distance / (111.32 * Math.cos((center.latitude * Math.PI) / 180))) *
    Math.sin(angle);

  return {
    latitude: Number((center.latitude + deltaLat).toFixed(6)),
    longitude: Number((center.longitude + deltaLon).toFixed(6)),
  };
};

const isTestRecord = (id, data) => {
  const text = [id, String(data.userId || ""), String(data.email || ""), String(data.name || "")]
    .join(" ")
    .toLowerCase();

  return /(test|teste|dummy|demo|example|qa)/.test(text);
};

const run = async () => {
  const now = new Date().toISOString();

  const usersSnapshot = await getDocs(collection(db, "users"));
  const professionalsSnapshot = await getDocs(collection(db, "professionals"));

  const usersToUpdate = usersSnapshot.docs.filter((docSnap) => {
    if (includeAllUsers) return true;
    return isTestRecord(docSnap.id, docSnap.data());
  });

  const professionalsToUpdate = professionalsSnapshot.docs.filter((docSnap) => {
    if (includeAllProfessionals) return true;
    return isTestRecord(docSnap.id, docSnap.data());
  });

  const cityCounter = {};

  for (const docSnap of usersToUpdate) {
    const center = weightedPick(centers);
    const coords = randomPointNear(center, maxRadiusKm);
    cityCounter[center.city] = (cityCounter[center.city] || 0) + 1;

    const current = docSnap.data();
    const address = current.address
      ? {
          ...current.address,
          city: center.city,
          state: center.state,
          country: current.address.country || "Brasil",
        }
      : null;

    if (!dryRun) {
      await updateDoc(docSnap.ref, {
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          updatedAt: now,
          source: "seed-test-locations",
        },
        ...(address ? { address } : {}),
      });
    }
  }

  for (const docSnap of professionalsToUpdate) {
    const center = weightedPick(centers);
    const coords = randomPointNear(center, maxRadiusKm);
    cityCounter[center.city] = (cityCounter[center.city] || 0) + 1;

    if (!dryRun) {
      await updateDoc(docSnap.ref, {
        city: center.city,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          updatedAt: now,
          source: "seed-test-locations",
        },
      });
    }
  }

  console.log("\n=== Seed de geolocalizacao concluido ===");
  console.log(`Usuarios atualizados: ${usersToUpdate.length}`);
  console.log(`Profissionais atualizados: ${professionalsToUpdate.length}`);
  console.log(`Raio maximo usado: ${maxRadiusKm} km`);
  console.log("Distribuicao por cidade:", cityCounter);
  if (dryRun) {
    console.log("Modo dry-run ativo: nenhum documento foi alterado.");
  }
};

run().catch((error) => {
  console.error("Erro ao gerar localizacoes de teste:", error);
  process.exit(1);
});
