import { Application } from "https://unpkg.com/@splinetool/runtime@1.0.67/build/runtime.js";

gsap.registerPlugin(ScrollTrigger);

/* ============================= */
/* SPLINE 3D BACKGROUND         */
/* ============================= */

const canvas = document.getElementById("spline-canvas");
const app = new Application(canvas);
app.load("https://prod.spline.design/QGs1d5MrRUfqvtsN/scene.splinecode");

/* ============================= */
/* SCROLL EFFECTS                */
/* ============================= */

gsap.to("#spline-canvas", {
  scale: 1.12,
  y: -120,
  ease: "none",
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: 1
  }
});

document.querySelectorAll(".reveal").forEach((el) => {
  ScrollTrigger.create({
    trigger: el,
    start: "top 85%",
    onEnter: () => el.classList.add("active"),
    once: true
  });
});

/* ============================== */
/* CONFIG                        */
/* ============================== */

const API_BASE = "http://localhost:8000";

/* ============================== */
/* DOM ELEMENTS                  */
/* ============================== */

const trafficLogBody = document.getElementById("traffic-log");
const blockedLog = document.getElementById("blocked-log");
const ztLog = document.getElementById("zt-log");

const packetsEl = document.getElementById("packets");
const attacksEl = document.getElementById("attacks");

/* ============================== */
/* ALERT SOUND SYSTEM            */
/* ============================== */

let soundEnabled = true;
const criticalSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alarm-tone-996.mp3");

/* ============================== */
/* HELPERS                       */
/* ============================== */

function randomIP() {
  return `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
}

/* ============================== */
/* ✅ SEND TRAFFIC TO BACKEND     */
/* ============================== */

async function sendRealTraffic() {
  const payload = {
    src_ip: randomIP(),
    dst_ip: randomIP(),
    protocol: ["TCP","UDP","ICMP"][Math.floor(Math.random()*3)]
  };

  const res = await fetch(`${API_BASE}/api/traffic/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  packetsEl.textContent = parseInt(packetsEl.textContent) + 1;
  if (data.is_attack) attacksEl.textContent = parseInt(attacksEl.textContent) + 1;

  if (data.severity === "Critical" && soundEnabled) {
    criticalSound.currentTime = 0;
    criticalSound.play();
  }
}

/* ============================== */
/* ✅ LOAD LIVE TRAFFIC           */
/* ============================== */

async function loadLiveTraffic() {
  try {
    const res = await fetch(`${API_BASE}/api/traffic/logs?limit=100`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    trafficLogBody.innerHTML = "";

    if (data && data.length > 0) {
      data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.src_ip}</td>
          <td>${row.dst_ip}</td>
          <td>${row.protocol}</td>
          <td class="${row.status === "Blocked" ? "blocked" : "allowed"}">${row.status}</td>
          <td>${row.attack_type || "-"}</td>
        `;
        trafficLogBody.appendChild(tr);
      });
    } else {
      trafficLogBody.innerHTML = '<tr><td colspan="5" class="text-center">No traffic data available</td></tr>';
    }
  } catch (error) {
    console.error('Error loading traffic data:', error);
    trafficLogBody.innerHTML = `<tr><td colspan="5" class="error">Error loading traffic data: ${error.message}</td></tr>`;
  }
}

/* ============================== */
/* ✅ LOAD BLOCKED IPs            */
/* ============================== */

async function loadBlockedIPs() {
  try {
    const res = await fetch(`${API_BASE}/api/traffic/blocked?limit=50`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    blockedLog.innerHTML = "";

    if (data && data.length > 0) {
      data.forEach(ip => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${ip.ip}</td>
          <td>${ip.attack_type || 'N/A'}</td>
          <td class="${ip.severity ? ip.severity.toLowerCase() : 'medium'}">${ip.severity || 'Medium'}</td>
          <td>${ip.timestamp ? new Date(ip.timestamp).toLocaleString() : 'N/A'}</td>
          <td>${ip.decision || 'Blocked'}</td>
        `;
        blockedLog.appendChild(tr);
      });
    } else {
      blockedLog.innerHTML = '<tr><td colspan="5" class="text-center">No blocked IPs found</td></tr>';
    }
  } catch (error) {
    console.error('Error loading blocked IPs:', error);
    blockedLog.innerHTML = `<tr><td colspan="5" class="error">Error loading blocked IPs: ${error.message}</td></tr>`;
  }
}

/* ============================== */
/* ✅ LOAD ZERO TRUST LOGS        */
/* ============================== */

async function loadZeroTrustLogs() {
  try {
    // The Zero Trust logs endpoint is not implemented in the backend yet
    ztLog.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          Zero Trust logs endpoint is not implemented yet
        </td>
      </tr>
    `;
  } catch (error) {
    console.error('Error loading Zero Trust logs:', error);
    ztLog.innerHTML = `
      <tr>
        <td colspan="5" class="error">
          Error loading Zero Trust logs: ${error.message}
        </td>
      </tr>
    `;
  }
}

/* ============================== */
/* ✅ REALTIME LOOP               */
/* ============================== */

// Function to update ML stats
async function updateMLStats() {
    try {
        const response = await fetch(`${API_BASE}/api/traffic/ml-stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Update the ML accuracy in the UI
        const mlAccuracyElement = document.getElementById('ml');
        if (mlAccuracyElement) {
            // Format as percentage with 1 decimal place
            const accuracyPercent = (data.accuracy * 100).toFixed(1);
            mlAccuracyElement.textContent = `${accuracyPercent}%`;
        }
    } catch (error) {
        console.error('Error fetching ML stats:', error);
    }
}

// Call this function when the page loads and periodically
document.addEventListener('DOMContentLoaded', () => {
    updateMLStats();
    // Update every 5 minutes (or adjust as needed)
    setInterval(updateMLStats, 5 * 60 * 1000);
});

setInterval(async () => {
  await sendRealTraffic();
  await loadLiveTraffic();
  await loadBlockedIPs();
  await loadZeroTrustLogs();
}, 2000);


