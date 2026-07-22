// seed.js — inserts 60 test players via POST /api/players
// Run: node server/seed.js   (while the server is running)

const API = "http://localhost:5001/api/players";

const required = [
  { name: "Harishwar",    stars: 5 },
  { name: "Roshan",       stars: 5 },
  { name: "Hari Krishnan",stars: 4 },
  { name: "Suresh",       stars: 4 },
];

const extras = [
  { name: "Arjun",       stars: 5 },
  { name: "Vikram",      stars: 5 },
  { name: "Karthik",     stars: 5 },
  { name: "Rajesh",      stars: 5 },
  { name: "Anand",       stars: 5 },
  { name: "Deepak",      stars: 4 },
  { name: "Sanjay",      stars: 4 },
  { name: "Manoj",       stars: 4 },
  { name: "Dinesh",      stars: 4 },
  { name: "Praveen",     stars: 4 },
  { name: "Naveen",      stars: 4 },
  { name: "Ganesh",      stars: 4 },
  { name: "Bala",        stars: 4 },
  { name: "Surya",       stars: 5 },
  { name: "Arun",        stars: 4 },
  { name: "Ravi",        stars: 3 },
  { name: "Suresh Kumar",stars: 3 },
  { name: "Muthu",       stars: 3 },
  { name: "Senthil",     stars: 3 },
  { name: "Lokesh",      stars: 3 },
  { name: "Pradeep",     stars: 3 },
  { name: "Vignesh",     stars: 4 },
  { name: "Kishore",     stars: 3 },
  { name: "Mathan",      stars: 3 },
  { name: "Saravanan",   stars: 3 },
  { name: "Prabhu",      stars: 3 },
  { name: "Selvam",      stars: 3 },
  { name: "Magesh",      stars: 3 },
  { name: "Harish",      stars: 4 },
  { name: "Balaji",      stars: 4 },
  { name: "Kavin",       stars: 3 },
  { name: "Nirmal",      stars: 3 },
  { name: "Vishal",      stars: 4 },
  { name: "Vinoth",      stars: 3 },
  { name: "Mohan",       stars: 3 },
  { name: "Sivakumar",   stars: 4 },
  { name: "Ramesh",      stars: 3 },
  { name: "Sugumar",     stars: 3 },
  { name: "Dhanush",     stars: 4 },
  { name: "Bharath",     stars: 3 },
  { name: "Ashwin",      stars: 5 },
  { name: "Yuvaraj",     stars: 4 },
  { name: "Prakash",     stars: 3 },
  { name: "Sathish",     stars: 3 },
  { name: "Anbarasan",   stars: 3 },
  { name: "Nithish",     stars: 3 },
  { name: "Joel",        stars: 4 },
  { name: "Jegan",       stars: 3 },
  { name: "Divakar",     stars: 3 },
  { name: "Shankar",     stars: 4 },
  { name: "Aakash",      stars: 3 },
  { name: "Sundar",      stars: 3 },
  { name: "Venkat",      stars: 3 },
  { name: "Gowtham",     stars: 4 },
  { name: "Vishnu",      stars: 3 },
];

const allPlayers = [...required, ...extras].slice(0, 60);

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function seed() {
  console.log("Seeding " + allPlayers.length + " players...");
  let added = 0, skipped = 0, failed = 0;

  for (const p of allPlayers) {
    const body = JSON.stringify({ id: uid(), name: p.name, stars: p.stars });
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.status === 201) {
        console.log("  Added: " + p.name + " (" + p.stars + " stars)");
        added++;
      } else if (res.status === 409) {
        console.log("  Skipped duplicate: " + p.name);
        skipped++;
      } else {
        const j = await res.json();
        console.log("  Failed: " + p.name + " - " + j.error);
        failed++;
      }
    } catch (e) {
      console.error("  Network error for " + p.name + ": " + e.message);
      failed++;
    }
  }

  console.log("\nDone! Added: " + added + ", Skipped: " + skipped + ", Failed: " + failed);
}

seed();
