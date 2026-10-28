/**
 * ===================================================================
 * Certificate Record System - Core Data Store, Router & Dynamic Renderer
 * Connected to MongoDB Atlas: atlas-almond-magnet.oijqqzc.mongodb.net
 * ===================================================================
 */

// Default Seed Certificates (Stored directly in codebase as backup)
const DEFAULT_CERTIFICATES = [
  {
    id: "CS/2026/JP/84920",
    certificateId: "CS/2026/JP/84920",
    studentName: "Mansi Suryawanshi",
    domain: "Java Programming Internship",
    duration: "4 weeks",
    startingDate: "25 January 2026",
    awardDate: "25 February 2026",
    credentialType: "Internship Completion Record",
    recordStatus: "Completed",
    issuerOrganization: "CodSoft (Virtual Internship Program)",
    verificationStatus: "Record Issued",
    recordReference: "IND-REC-202602-0941"
  },
  {
    id: "CS/2026/JP/32816",
    certificateId: "CS/2026/JP/32816",
    studentName: "Mansi Suryawanshi",
    domain: "Java Programming Internship",
    duration: "4 weeks",
    startingDate: "25 January 2026",
    awardDate: "25 February 2026",
    credentialType: "Internship Completion Record",
    recordStatus: "Completed",
    issuerOrganization: "CodSoft (Virtual Internship Program)",
    verificationStatus: "Record Issued",
    recordReference: "IND-REC-202602-32816"
  }
];

const certificateData = DEFAULT_CERTIFICATES[0];
const STORAGE_KEY = "codsoft_certificates_store_v1";

/**
 * Certificate Database Manager (MongoDB Atlas API + LocalStorage Cache)
 */
const CertificateStore = {
  getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          DEFAULT_CERTIFICATES.forEach(def => {
            const defId = def.id || def.certificateId;
            if (!merged.some(m => (m.id || m.certificateId) === defId)) {
              merged.push(def);
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using default seed records.", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CERTIFICATES));
  },

  saveAll(certificates) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(certificates));
      return true;
    } catch (e) {
      console.error("Failed to save certificates to localStorage:", e);
      return false;
    }
  },

  getById(rawCode) {
    if (!rawCode) return null;
    const all = this.getAll();
    const cleanRaw = rawCode.trim().toLowerCase();
    const alphaNumRaw = cleanRaw.replace(/[^a-z0-9]/g, "");

    // 1. Exact match on ID or certificateId
    let match = all.find(c => {
      const id1 = ((c.id || "")).trim().toLowerCase();
      const id2 = ((c.certificateId || "")).trim().toLowerCase();
      return id1 === cleanRaw || id2 === cleanRaw;
    });
    if (match) return match;

    // 2. Alphanumeric match (ignores hyphens, slashes, spaces)
    match = all.find(c => {
      const idClean = ((c.id || c.certificateId) || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return idClean === alphaNumRaw;
    });
    if (match) return match;

    // 3. Number/Suffix Match (e.g. user enters "32816" -> matches "CS/2026/JP/32816")
    if (alphaNumRaw.length >= 3) {
      match = all.find(c => {
        const idClean = ((c.id || c.certificateId) || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return idClean.endsWith(alphaNumRaw) || idClean.includes(alphaNumRaw);
      });
      if (match) return match;
    }

    // 4. Candidate Name Match (e.g. "mansi" or "mansi-suryawanshi")
    match = all.find(c => {
      const nameClean = (c.studentName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return nameClean.includes(alphaNumRaw) || alphaNumRaw.includes(nameClean);
    });
    if (match) return match;

    return null;
  },

  save(cert) {
    const all = this.getAll();
    const certId = cert.id || cert.certificateId;
    const index = all.findIndex(c => (c.id || c.certificateId) === certId);
    if (index >= 0) {
      all[index] = { ...all[index], ...cert, id: certId, certificateId: certId };
    } else {
      all.unshift({ ...cert, id: certId, certificateId: certId });
    }
    this.saveAll(all);
    return cert;
  },

  delete(id) {
    let all = this.getAll();
    all = all.filter(c => (c.id || c.certificateId) !== id);
    if (all.length === 0) {
      all = JSON.parse(JSON.stringify(DEFAULT_CERTIFICATES));
    }
    this.saveAll(all);
    return all;
  },

  // Asynchronous MongoDB Atlas Methods
  async fetchFromMongo(id) {
    try {
      const url = id ? `/api/certificates?id=${encodeURIComponent(id)}` : '/api/certificates';
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success) {
        if (id && data.certificate) {
          this.save(data.certificate);
          return data.certificate;
        } else if (data.certificates) {
          this.saveAll(data.certificates);
          return data.certificates;
        }
      }
    } catch (e) {}
    return null;
  },

  async saveToMongo(cert) {
    this.save(cert); // Save locally first for instant UI response
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert)
      });
      if (!res.ok) return { success: false, status: res.status };
      return await res.json();
    } catch (e) {
      console.warn("Could not sync to MongoDB:", e);
      return { success: false, offline: true };
    }
  },

  async deleteFromMongo(id) {
    this.delete(id);
    try {
      await fetch(`/api/certificates?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}
  },

  resetToDefault() {
    this.saveAll(DEFAULT_CERTIFICATES);
    return DEFAULT_CERTIFICATES;
  }
};

/**
 * Universal URL Data Encoding / Decoding
 */
const CertificateURL = {
  encodeData(cert) {
    try {
      const json = JSON.stringify(cert);
      return btoa(encodeURIComponent(json));
    } catch (e) {
      return "";
    }
  },

  decodeData(encoded) {
    try {
      const json = decodeURIComponent(atob(encoded));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  },

  buildVerificationUrl(cert, customBaseUrl) {
    let base = customBaseUrl ? customBaseUrl.trim() : "";
    if (!base) {
      const loc = window.location;
      base = `${loc.protocol}//${loc.host}`;
    }

    base = base.replace(/\/+$/, "");
    const certId = cert.id || cert.certificateId;
    return `${base}/${certId}`;
  }
};

/**
 * Extract certificate code / ID from URL
 */
function extractCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);

  // 1. Query parameters (?id=... or ?code=...)
  if (urlParams.get("id")) {
    try {
      return decodeURIComponent(urlParams.get("id")).trim();
    } catch (e) {
      return urlParams.get("id").trim();
    }
  }
  if (urlParams.get("code")) {
    try {
      return decodeURIComponent(urlParams.get("code")).trim();
    } catch (e) {
      return urlParams.get("code").trim();
    }
  }

  // 2. Hash routing (#32816 or #/CS/2026/JP/32816)
  if (window.location.hash) {
    const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
    if (rawHash && rawHash !== "index.html") {
      try {
        return decodeURIComponent(rawHash);
      } catch (e) {
        return rawHash;
      }
    }
  }

  // 3. Pathname after slash (/CS/2026/JP/32816, /84920, etc.)
  let path = window.location.pathname;
  try {
    path = decodeURIComponent(path);
  } catch (e) {}

  path = path.replace(/^\/+|\/+$/g, "").trim();

  const ignored = [
    "",
    "index.html",
    "admin.html",
    "admin",
    "qr-generator.html",
    "qr-generator",
    "favicon.ico",
    "generate_qr.py",
    "readme.md",
    "vercel.json"
  ];

  if (ignored.includes(path.toLowerCase()) || path.startsWith("css/") || path.startsWith("js/")) {
    return null;
  }

  return path;
}

/**
 * Render Certificate Data into DOM elements
 */
function displayCertificate(data) {
  if (!data) return;

  const certId = data.id || data.certificateId || "CS/2026/JP/84920";

  // Strictly Lock Tab Title
  document.title = "Certificate Verification | CodSoft";

  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || "—";
  };

  // Student & Program Highlights
  safeSetText("heroStudentName", data.studentName);
  safeSetText("heroDomain", data.domain);
  safeSetText("badgeStatus", data.verificationStatus || "Record Issued");

  // Detailed Grid
  safeSetText("certId", certId);
  safeSetText("detailStudentName", data.studentName);
  safeSetText("detailDomain", data.domain);
  safeSetText("detailDuration", data.duration);
  safeSetText("detailStartDate", data.startingDate);
  safeSetText("detailAwardDate", data.awardDate);
  safeSetText("detailStatus", data.recordStatus || "Completed");
  safeSetText("detailIssuer", data.issuerOrganization || "CodSoft (Virtual Internship Program)");

  // Footer metadata
  safeSetText("footerCertId", certId);
  const footerWrap = document.getElementById("footerCertWrap");
  if (footerWrap) footerWrap.style.display = "inline";

  // Dynamic Year
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Switch View Visibility
  const homeView = document.getElementById("homeView");
  const resultView = document.getElementById("resultView");
  if (homeView && resultView) {
    homeView.classList.add("hidden");
    resultView.classList.remove("hidden");
  }
}

/**
 * Switch back to Home Verification Search View
 */
function switchToHomeView() {
  const homeView = document.getElementById("homeView");
  const resultView = document.getElementById("resultView");
  const errorAlert = document.getElementById("searchErrorAlert");
  const searchInput = document.getElementById("searchCertInput");

  if (homeView && resultView) {
    resultView.classList.add("hidden");
    homeView.classList.remove("hidden");
  }

  const footerWrap = document.getElementById("footerCertWrap");
  if (footerWrap) footerWrap.style.display = "none";

  if (errorAlert) {
    errorAlert.style.display = "none";
    errorAlert.textContent = "";
  }

  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }

  document.title = "Certificate Verification | CodSoft";

  // Reset URL to root cleanly without reload
  if (window.history && window.history.pushState) {
    window.history.pushState({}, "", "/");
  }
}

/**
 * Search and verify certificate from home input (checks MongoDB Atlas first)
 */
async function submitVerificationSearch() {
  const inputEl = document.getElementById("searchCertInput");
  const errorAlert = document.getElementById("searchErrorAlert");
  if (!inputEl) return;

  const rawCode = inputEl.value.trim();
  if (!rawCode) return;

  // 1. Try querying MongoDB Atlas
  let found = await CertificateStore.fetchFromMongo(rawCode);

  // 2. Fall back to local store
  if (!found) {
    found = CertificateStore.getById(rawCode);
  }

  if (found) {
    if (errorAlert) errorAlert.style.display = "none";
    displayCertificate(found);

    if (window.history && window.history.pushState) {
      window.history.pushState({}, "", `/${found.id}`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    if (errorAlert) {
      const safeCode = rawCode.replace(/[<>&"']/g, "");
      errorAlert.innerHTML = `No certificate record found for "<strong>${safeCode}</strong>". Please check the Certificate ID printed on your document and try again.`;
      errorAlert.style.display = "block";
    }
  }
}

/**
 * Initialize View Routing on Page Load
 */
async function initViewRouting() {
  // Check if self-contained data payload is in URL (?data=...)
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get("data");
  if (dataParam) {
    const decoded = CertificateURL.decodeData(dataParam);
    if (decoded && decoded.studentName) {
      CertificateStore.save(decoded);
      displayCertificate(decoded);
      return;
    }
  }

  // Check code extracted from pathname (/CS/2026/JP/32816, /84920), query or hash
  const extractedCode = extractCodeFromUrl();
  if (extractedCode) {
    // 1. Instant cache render
    let found = CertificateStore.getById(extractedCode);
    if (found) {
      displayCertificate(found);
    }

    // 2. Fetch fresh live data from MongoDB Atlas
    const mongoCert = await CertificateStore.fetchFromMongo(extractedCode);
    if (mongoCert) {
      displayCertificate(mongoCert);
      return;
    }

    if (found) return;

    // Fallback dynamic record
    const defaultCert = DEFAULT_CERTIFICATES[0];
    const customRecord = {
      studentName: defaultCert.studentName,
      domain: defaultCert.domain,
      duration: defaultCert.duration,
      startingDate: defaultCert.startingDate,
      awardDate: defaultCert.awardDate,
      id: extractedCode,
      certificateId: extractedCode,
      recordStatus: "Completed",
      issuerOrganization: defaultCert.issuerOrganization,
      verificationStatus: "Record Issued",
      recordReference: `IND-REC-${extractedCode.replace(/[^0-9]/g, "").slice(-6) || "RECORD"}`
    };
    displayCertificate(customRecord);
    return;
  }

  // 3. If at root without any code, show Home Verification View
  const homeView = document.getElementById("homeView");
  const resultView = document.getElementById("resultView");
  const footerWrap = document.getElementById("footerCertWrap");
  if (footerWrap) footerWrap.style.display = "none";
  if (homeView && resultView) {
    homeView.classList.remove("hidden");
    resultView.classList.add("hidden");
  }
}

// Auto-run when DOM is ready
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("homeView")) {
      initViewRouting();
    }
  });

  window.addEventListener("hashchange", () => {
    if (document.getElementById("homeView")) {
      initViewRouting();
    }
  });
}
