// seed.js — inserts 56 test players via POST /api/players
// Run: node api/seed.js   (while the server is running on port 5001)

const API = "http://localhost:5001/api/players";

// 56 players: ~8×5⭐ | ~14×4⭐ | ~22×3⭐ | ~12×2⭐
const allPlayers = [
  // ── 5 Stars (8) ──────────────────────────────────────────────────────────
  { name: "Harishwar",     stars: 5 },
  { name: "Roshan",        stars: 5 },
  { name: "Arjun",         stars: 5 },
  { name: "Vikram",        stars: 5 },
  { name: "Surya",         stars: 5 },
  { name: "Ashwin",        stars: 5 },
  { name: "Karthik",       stars: 5 },
  { name: "Rajesh",        stars: 5 },

  // ── 4 Stars (14) ─────────────────────────────────────────────────────────
  { name: "Hari Krishnan", stars: 4 },
  { name: "Suresh",        stars: 4 },
  { name: "Deepak",        stars: 4 },
  { name: "Sanjay",        stars: 4 },
  { name: "Manoj",         stars: 4 },
  { name: "Naveen",        stars: 4 },
  { name: "Ganesh",        stars: 4 },
  { name: "Vignesh",       stars: 4 },
  { name: "Harish",        stars: 4 },
  { name: "Balaji",        stars: 4 },
  { name: "Vishal",        stars: 4 },
  { name: "Dhanush",       stars: 4 },
  { name: "Joel",          stars: 4 },
  { name: "Gowtham",       stars: 4 },

  // ── 3 Stars (22) ─────────────────────────────────────────────────────────
  { name: "Ravi",          stars: 3 },
  { name: "Muthu",         stars: 3 },
  { name: "Senthil",       stars: 3 },
  { name: "Lokesh",        stars: 3 },
  { name: "Pradeep",       stars: 3 },
  { name: "Kishore",       stars: 3 },
  { name: "Mathan",        stars: 3 },
  { name: "Saravanan",     stars: 3 },
  { name: "Prabhu",        stars: 3 },
  { name: "Selvam",        stars: 3 },
  { name: "Magesh",        stars: 3 },
  { name: "Kavin",         stars: 3 },
  { name: "Nirmal",        stars: 3 },
  { name: "Vinoth",        stars: 3 },
  { name: "Mohan",         stars: 3 },
  { name: "Ramesh",        stars: 3 },
  { name: "Bharath",       stars: 3 },
  { name: "Prakash",       stars: 3 },
  { name: "Sathish",       stars: 3 },
  { name: "Nithish",       stars: 3 },
  { name: "Jegan",         stars: 3 },
  { name: "Shankar",       stars: 3 },

  // ── 2 Stars (12) ─────────────────────────────────────────────────────────
  { name: "Divakar",       stars: 2 },
  { name: "Aakash",        stars: 2 },
  { name: "Sundar",        stars: 2 },
  { name: "Venkat",        stars: 2 },
  { name: "Vishnu",        stars: 2 },
  { name: "Sugumar",       stars: 2 },
  { name: "Anbarasan",     stars: 2 },
  { name: "Sivakumar",     stars: 2 },
  { name: "Yuvaraj",       stars: 2 },
  { name: "Arun",          stars: 2 },
  { name: "Bala",          stars: 2 },
  { name: "Praveen",       stars: 2 },
];

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
