//DATABASE SYSTEM PRISM
/* global supabase */

// --- 1. SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://xblpzpabthcpimziqjor.supabase.co';
// Replace with your actual anon key from Supabase Dashboard -> Settings -> API
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibHB6cGFidGhjcGltemlxam9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTk5NjksImV4cCI6MjEwNTYzNTk2OX0.C2XJwS7Zk1MSS8ktbEO7d9eEr_RVAx0bo9qfzkzdlzM'; 


const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. GLOBAL STATE ---
let isAdminMode = false;

let courses = [];

async function loadCoursesFromDatabase() {
    try {
        const { data, error } = await db
            .from('Course')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Supabase fetch error:', error);
            return;
        }

        // Update global array so existing renderers can use it
        courses = data || [];
        console.log('Courses loaded from Supabase:', courses);

        // Call UI renderers
        if (typeof renderCourses === 'function') renderCourses();
        if (typeof renderScheduleTab === 'function') renderScheduleTab();
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

window.onload = async function () {
    await loadCoursesFromDatabase();
    if (typeof renderGallery === 'function') renderGallery();
    if (typeof initScheduleInputs === 'function') initScheduleInputs();
};

// --- 4. ADMIN SAVE COURSE HANDLER ---
async function handleSaveCourse(e) {
  e.preventDefault();

  // 1. Extract values from DOM
  const id = document.getElementById('editing-course-id').value;
  const title = document.getElementById('course-title').value.trim();
  const duration = document.getElementById('course-duration').value.trim();
  let rawFee = document.getElementById('course-fee').value.trim();
  const googleFormUrl = document.getElementById('course-form-url').value;
  const gradFormUrl = document.getElementById('course-grad-url').value;
  
  // Extract selected category value
  const categorySelect = document.getElementById('course-category');
  const category = categorySelect ? categorySelect.value : 'stcw';

  // 2. Format Fee
  let fee = rawFee ? (rawFee.startsWith('₱') ? rawFee : `₱${rawFee}`) : '₱0.00';

  // 3. Extract schedules array
  const scheduleInputs = document.querySelectorAll('.course-schedule-item');
  const schedules = Array.from(scheduleInputs)
    .map(input => input.value.trim())
    .filter(val => val.length > 0);

  // 4. Construct payload for Supabase matching table columns
  const payload = {
    title,
    duration,
    category, // Includes selected category in payload
    fee,
    googleFormUrl,
    gradFormUrl,
    schedules
  };

  try {
    if (id) {
      // UPDATE existing row in Supabase
      const { error } = await db
        .from('Course')
        .update(payload)
        .eq('id', parseInt(id));

      if (error) throw error;

      document.getElementById('editing-course-id').value = '';
      document.getElementById('course-submit-btn').textContent = 'Publish Course';

      // SHOW CUSTOM MODAL FOR UPDATE
      await showAlert('Course details successfully updated!', 'success');
    } else {
      // INSERT new row into Supabase
      const { error } = await db
        .from('Course')
        .insert([payload]);

      if (error) throw error;

      // SHOW CUSTOM MODAL FOR PUBLISH
      await showAlert('Course successfully published!', 'success');
    }

    // 5. Reset Form & Refresh UI from Supabase
    document.getElementById('course-form').reset();
    if (typeof initScheduleInputs === 'function') {
      initScheduleInputs(['']);
    }

    if (typeof loadCoursesFromDatabase === 'function') {
      await loadCoursesFromDatabase();
    } else if (typeof renderScheduleTab === 'function') {
      renderScheduleTab();
    }
  } catch (err) {
    // SHOW CUSTOM MODAL FOR ERRORS
    await showAlert('Database error: ' + err.message, 'danger');
    console.error('Supabase write error:', err);
  }
}



//////////////////////////////////////////////////////////////////////////////////////////////////////
/* THIS IS FOR LANDING PAGE WHERE IT HAS REQUIREMENTS LIST AND THE GOOGLE FORM HARDCODED (OPTIONAL)
// Database of course details with UNIQUE form links, titles, and requirements
const courseData = {
  // Passenger Ship Courses
  'PSCMHB': {
    title: 'PASSENGER SHIP CRISIS MANAGEMENT AND HUMAN BEHAVIOR (PSCMHB)',
    desc: 'This course equips shipboard personnel with the knowledge and skills to effectively manage crisis situations and understand human behavior during emergencies on passenger ships.',
    requirements: [
      'PSA Birth Certificate / Passport',
      'Seafarer\'s Registration Number',
      'Valid Medical in PEME Form',
      'Safety Training for Personnel Providing Direct Service to Passengers (STPPDSP) Certificate',
      'Passenger Ship Crowd Management (PSCM) Certificate'
    ],
    heroImg: 'img/pscmhb-hero.jpg',
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_PSCMHB_FORM_ID/viewform' // UNIQUE FORM
  },
  'STPPDSP': {
    title: 'SAFETY TRAINING FOR PERSONNEL PROVIDING DIRECT SERVICES TO PASSENGERS',
    desc: 'Training for personnel providing direct safety services to passengers in passenger spaces.',
    requirements: [
      'PSA Birth Certificate / Passport',
      'Seafarer\'s Registration Number',
      'Valid Medical in PEME Form'
    ],
    heroImg: 'img/stppdsp-hero.jpg',
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_STPPDSP_FORM_ID/viewform' // UNIQUE FORM
  },
  'PSCM': {
    title: 'PASSENGER SHIP CROWD MANAGEMENT TRAINING (PSCM)',
    desc: 'Essential crowd management training for ship officers and personnel designated to assist passengers in emergency situations.',
    requirements: [
      'PSA Birth Certificate / Passport',
      'Seafarer\'s Registration Number',
      'Valid Medical in PEME Form'
    ],
    heroImg: 'img/pscm-hero.jpg',
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_PSCM_FORM_ID/viewform' // UNIQUE FORM
  },

  // STCW Mandatory Courses
  'AFF': {
    title: 'ADVANCED FIRE FIGHTING (AFF)',
    desc: 'Comprehensive training in controlling firefighting operations aboard ship, organizing fire parties, and inspecting fire systems.',
    requirements: [
      'PSA Birth Certificate / Passport',
      'Seafarer\'s Registration Number',
      'Valid Medical in PEME Form',
      'Basic Training (BT) Certificate'
    ],
    heroImg: 'img/aff-hero.jpg',
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_AFF_FORM_ID/viewform' // UNIQUE FORM
  },
  'BT': {
    title: 'BASIC TRAINING (BT)',
    desc: 'Mandatory safety training covering Personal Survival Techniques, Fire Prevention, Elementary First Aid, and Personal Safety.',
    requirements: [
      'PSA Birth Certificate / Passport',
      'Seafarer\'s Registration Number',
      'Valid Medical in PEME Form'
    ],
    heroImg: 'img/bt-hero.jpg',
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_BT_FORM_ID/viewform' // UNIQUE FORM
  },

  // Offered Packages
  'PACKAGE_A': {
    title: 'PASSENGER SHIP SAFETY PACKAGE A',
    desc: 'Bundled training package including BT, SAT/SDSD, Safety Training for Personnel, and Crowd Management.',
    requirements: [
      'PSA Birth Certificate / Passport',
      'Seafarer\'s Registration Number',
      'Valid Medical in PEME Form'
    ],
    heroImg: 'img/package-a-hero.jpg',
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_PACKAGE_A_FORM_ID/viewform' // UNIQUE FORM
  },
  'PACKAGE_B': {
    title: 'PASSENGER SHIP SAFETY PACKAGE B',
    desc: 'Complete training bundle including BT, SAT/SDSD, Safety Training for Personnel, Crowd Management, and Crisis Management.',
    requirements: [
      'PSA Birth Certificate / Passport',
      'Seafarer\'s Registration Number',
      'Valid Medical in PEME Form'
    ],
    heroImg: 'img/package-b-hero.jpg',
    formUrl: 'https://docs.google.com/forms/d/e/YOUR_PACKAGE_B_FORM_ID/viewform' // UNIQUE FORM
  }
};
// ENROLLMENT FORM WITH REQUIREMENTS LANDING PAGE
function openEnrollmentLanding(courseKey) {
  const data = courseData[courseKey];

  if (!data) {
    console.error(`Course key "${courseKey}" not found in courseData.`);
    return;
  }

  // 1. Update text, headings, image, and link dynamically
  document.getElementById('detail-course-title').textContent = data.title;
  document.getElementById('detail-portal-course-tag').textContent = data.title;
  document.getElementById('detail-course-desc').textContent = data.desc;
  document.getElementById('detail-hero-img').src = data.heroImg;
  
  // Update unique form link
  const formBtn = document.getElementById('detail-form-link');
  formBtn.href = data.formUrl;

  // 2. Render dynamic requirements list
  const reqList = document.getElementById('detail-requirements-list');
  reqList.innerHTML = '';
  data.requirements.forEach(req => {
    const li = document.createElement('li');
    li.textContent = req;
    reqList.appendChild(li);
  });

  // 3. Navigate to landing view
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.sub-landing-tab').forEach(sub => sub.classList.add('hidden'));
  
  const landing = document.getElementById('enrollment-detail-landing');
  landing.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}*/
//////////////////////////////////////////////////////////////////////////////////////////////////////





// --- ADMIN & GOOGLE OAUTH CONFIGURATION ---
const ALLOWED_ADMIN_EMAILS = [
  "mtac.it@dmmacsp.edu.ph",
  "mtac.technical-staff-ii@dmmacsp.edu.ph"
];

// --- AUTH STATE LISTENER & SESSION INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  // Listen for login/logout state changes across tabs or OAuth redirects
  db.auth.onAuthStateChange((event, session) => {
    handleUserViewState(session);
  });

  // Check initial session state on page load
  const { data: { session } } = await db.auth.getSession();
  handleUserViewState(session);
});

// --- MAIN ROUTING LOGIC ---
function handleUserViewState(session) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminBtn = document.getElementById("admin-tab-btn");

  if (session && session.user) {
    const userEmail = session.user.email?.toLowerCase().trim();

    // 1. ALL LOGGED-IN USERS (Admin or Regular Client):
    // Hide Google Login, show Logout button
    if (loginBtn) {
      loginBtn.style.setProperty("display", "none", "important");
      loginBtn.classList.add("is-hidden");
    }
    if (logoutBtn) {
      logoutBtn.style.setProperty("display", "inline-flex", "important");
      logoutBtn.classList.remove("is-hidden");
    }

    // 2. CHECK AUTHORIZATION FOR ADMIN vs STANDARD CLIENT
    if (ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
      console.log("Authorized Admin logged in:", userEmail);
      
      // Reveal Edit Mode button in navbar
      if (adminBtn) {
        adminBtn.style.setProperty("display", "inline-flex", "important");
        adminBtn.classList.remove("is-hidden", "hidden");
      }

      // Reveal all admin portal elements
      const adminElements = document.querySelectorAll(".admin-only");
      adminElements.forEach(el => el.classList.remove("hidden"));

      // Route admin directly to the Admin Panel tab
      if (typeof switchTab === 'function') {
        switchTab('admin-tab');
      }
    } else {
      console.log("Standard client logged in (for forms/enrollment):", userEmail);

      // Hide Edit Mode button and Admin sections from non-admin users
      if (adminBtn) {
        adminBtn.style.setProperty("display", "none", "important");
        adminBtn.classList.add("is-hidden");
      }

      const adminElements = document.querySelectorAll(".admin-only");
      adminElements.forEach(el => el.classList.add("hidden"));

      // Stay on/redirect standard clients to standard site tabs (Home/Trainings)
      if (typeof switchTab === 'function') {
        // If they were on the admin tab, send them home
        const currentTab = document.querySelector('.tab-content.active')?.id;
        if (currentTab === 'admin-tab') {
          switchTab('home-tab');
        }
      }
    }
  } else {
    // Unauthenticated Public View
    enablePublicView();
  }
}

// --- PUBLIC VIEW RESET ---
function enablePublicView() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminBtn = document.getElementById("admin-tab-btn");

  // Show Google Login, hide Logout & Edit Mode
  if (loginBtn) {
    loginBtn.style.setProperty("display", "inline-flex", "important");
    loginBtn.classList.remove("is-hidden");
  }
  if (logoutBtn) {
    logoutBtn.style.setProperty("display", "none", "important");
    logoutBtn.classList.add("is-hidden");
  }
  if (adminBtn) {
    adminBtn.style.setProperty("display", "none", "important");
    adminBtn.classList.add("is-hidden", "hidden");
  }

  // Hide all admin controls
  const adminElements = document.querySelectorAll(".admin-only");
  adminElements.forEach(el => el.classList.add("hidden"));
}

// --- AUTHENTICATION ACTION HANDLERS ---
async function handleGoogleLogin() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });
  if (error) console.error("Google Login failed:", error.message);
}

async function handleLogout() {
  await db.auth.signOut();
  enablePublicView();
  if (typeof switchTab === 'function') {
    switchTab('home-tab');
  }
  window.location.reload();
}

window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;



//HAMBURGER TOGGLE FIX
document.addEventListener("DOMContentLoaded", async () => {
  // Check auth state safely
  try {
    if (typeof checkUserSession === "function") {
      await checkUserSession();
    }
  } catch (error) {
    console.error("Auth session check failed:", error);
  }

  // --- HAMBURGER MENU TOGGLE ---
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navMenu = document.querySelector(".nav-links");

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      hamburgerBtn.classList.toggle("open");
    });
  }
});

async function checkUserSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.warn("Supabase session error:", error.message);
    return null;
  }

  if (data && data.session) {
    // User is logged in
    return data.session;
  }

  return null;
}



// 3D CAROUSEL CARD STYLE HOME PAGE
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.coverflow-card');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  let currentIndex = 0;

  function updateCoverflow() {
    cards.forEach((card, index) => {
      card.className = 'coverflow-card'; // reset classes

      if (index === currentIndex) {
        card.classList.add('active');
      } else if (index === (currentIndex - 1 + cards.length) % cards.length) {
        card.classList.add('prev');
      } else if (index === (currentIndex + 1) % cards.length) {
        card.classList.add('next');
      } else if (index === (currentIndex - 2 + cards.length) % cards.length) {
        card.classList.add('far-prev');
      } else {
        card.classList.add('far-next');
      }
    });

    // Update Dots Indicator
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % cards.length;
    updateCoverflow();
  });

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCoverflow();
  });

  // Optional: Auto-play every 5 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % cards.length;
    updateCoverflow();
  }, 5000);
});

//GALLERY GRID IMAGES DYNAMIC SCROLL / NEXT
document.addEventListener("DOMContentLoaded", () => {
  const galleryGrid = document.getElementById("gallery-grid");
  const lightbox = document.getElementById("gallery-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.querySelector(".lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  if (!galleryGrid || !lightbox) return;

  let galleryImages = [];
  let currentIndex = 0;

  function updateLightbox(index) {
    if (!galleryImages.length) return;
    currentIndex = index;
    const selectedImg = galleryImages[currentIndex];

    // Safely sets full image source (Data URLs/Base64 or server paths uploaded via Admin)
    if (lightboxImg) lightboxImg.src = selectedImg.src;

    // Grab text from parent .gallery-card paragraph or image alt attribute
    const parentCard = selectedImg.closest(".gallery-card") || selectedImg.parentElement;
    const captionText = parentCard ? parentCard.querySelector("p")?.innerText : "";
    
    if (lightboxCaption) {
      lightboxCaption.innerText = captionText || selectedImg.alt || "Gallery Image";
    }
  }

  // EVENT DELEGATION: Listens to clicks on images added dynamically via Admin Mode
  galleryGrid.addEventListener("click", (e) => {
    const clickedImg = e.target.closest("img");
    if (!clickedImg) return;

    // Refresh the image list instantly whenever an image is clicked
    galleryImages = Array.from(galleryGrid.querySelectorAll("img"));
    const index = galleryImages.indexOf(clickedImg);

    if (index !== -1) {
      updateLightbox(index);
      lightbox.classList.add("active");
    }
  });

  // Carousel Next/Previous Controls
  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!galleryImages.length) return;
    currentIndex = (currentIndex + 1) % galleryImages.length;
    updateLightbox(currentIndex);
  });

  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!galleryImages.length) return;
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightbox(currentIndex);
  });

  // Close handlers
  closeBtn?.addEventListener("click", () => lightbox.classList.remove("active"));
  
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("active");
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") lightbox.classList.remove("active");
    if (e.key === "ArrowRight") nextBtn?.click();
    if (e.key === "ArrowLeft") prevBtn?.click();
  });
});


// NAVIGATION BAR FUNCTION HAMBURGER
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Close menu when a navigation item is tapped
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
});


window.onload = function () {
    loadCoursesFromDatabase();
    renderGallery();
    initScheduleInputs();
};

window.onload = async function () {
    await loadCoursesFromDatabase();
    await loadGalleryFromDatabase();
};

// 1. Toggle Admin Mode
function toggleAdminMode(enable) {
    isAdminMode = enable;
    const adminBanner = document.getElementById('admin-banner'); //
    const adminTabBtn = document.getElementById('admin-tab-btn'); //
    const adminGateBtn = document.getElementById('admin-gate-btn');

    if (isAdminMode) {
        if (adminBanner) adminBanner.classList.remove('hidden'); //
        if (adminTabBtn) adminTabBtn.classList.remove('hidden'); //
        if (adminGateBtn) adminGateBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Admin';
        switchTab('admin-tab'); //
    } else {
        if (adminBanner) adminBanner.classList.add('hidden'); //
        if (adminTabBtn) adminTabBtn.classList.add('hidden'); //
        if (adminGateBtn) adminGateBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Admin';
        switchTab('home-tab'); //
    }
}


// TAB SWITCHER
function switchTab(tabId, updateHistory = true) {
  // 1. Hide all sub-landing pages
  const subTabs = document.querySelectorAll('.sub-landing-tab');
  subTabs.forEach(subTab => {
    subTab.classList.add('hidden');
    subTab.style.display = '';
  });

  // 2. Reset and display main tab contents
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    tab.classList.add('hidden'); // Ensure hidden state is explicitly assigned
    tab.style.display = '';
  });

  // 3. Activate the selected tab section
  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.remove('hidden');
    activeTab.classList.add('active');
  }

  // 4. Update active visual state on navbar links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === `#${tabId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 5. Push entry into browser history if requested
  if (updateHistory && window.location.hash !== `#${tabId}`) {
    history.pushState({ tabId: tabId }, '', `#${tabId}`);
  }

  // Jump to top instantly
  window.scrollTo(0, 0);

  // Remove focus from clicked link
  if (document.activeElement) {
    document.activeElement.blur();
  }

  // 6. FIX: Delay flipbook refresh slightly so browser finishes displaying the tab container
  if (tabId === 'stories-tab') {
    setTimeout(() => {
      initFlipbook();
    }, 150);
  }
}

// Handle Browser Back / Forward button navigation
window.addEventListener('popstate', (event) => {
  const currentHash = window.location.hash.replace('#', '') || 'home-tab';
  switchTab(currentHash, false);
});

// Load correct tab on initial page refresh or direct link opening
window.addEventListener('DOMContentLoaded', () => {
  const initialHash = window.location.hash.replace('#', '') || 'home-tab';
  switchTab(initialHash, false);
});


// Attached click handlers to all navigation links
document.querySelectorAll('.nav-link, a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').replace('#', '');

    if (targetId) {
      // 1. Switch the UI tab
      switchTab(targetId, true);

      // 2. Push hash into browser history so Back/Forward buttons activate
      history.pushState({ tabId: targetId }, '', `#${targetId}`);
    }
  });
});



// Passenger Training Course Sub-Landing
function showSubCategory(subLandingId) {
    // 1. Hide ALL main tab containers explicitly
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none'; // Forces main tab cards to hide
    });

    // 2. Hide any other sub-landing pages
    const subTabs = document.querySelectorAll('.sub-landing-tab');
    subTabs.forEach(subTab => subTab.classList.add('hidden'));

    // 3. Show target sub-landing page
    const targetSubLanding = document.getElementById(subLandingId);
    if (targetSubLanding) {
        targetSubLanding.classList.remove('hidden');
        targetSubLanding.style.display = 'block'; // Ensures section is displayed
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}


// NOTIFICATION ALERT POPUP MESSAGE)
function showAlert(message, type = 'success') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-alert-modal');
        const msgEl = document.getElementById('custom-modal-message');
        const iconEl = document.getElementById('custom-modal-icon');
        const actionsEl = document.getElementById('custom-modal-actions');

        msgEl.innerText = message;

        // Customize Icon based on event type
        if (type === 'success') {
            iconEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #22c55e;"></i>';
        } else if (type === 'danger') {
            iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #ff0000;"></i>';
        } else {
            iconEl.innerHTML = '<i class="fa-solid fa-circle-info" style="color: #3b82f6;"></i>';
        }

        // Render OK Button
        actionsEl.innerHTML = `<button id="modal-ok-btn" class="btn-modal-primary">OK</button>`;

        modal.classList.remove('hidden');

        document.getElementById('modal-ok-btn').onclick = () => {
            modal.classList.add('hidden');
            resolve(true);
        };
    });
}

// Show Custom Confirmation Popup (Replaces confirm() for Deletion)
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-alert-modal');
        const msgEl = document.getElementById('custom-modal-message');
        const iconEl = document.getElementById('custom-modal-icon');
        const actionsEl = document.getElementById('custom-modal-actions');

        msgEl.innerText = message;
        iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #ff0000;"></i>';

        // Render Confirm & Cancel Buttons
        actionsEl.innerHTML = `
            <button id="modal-cancel-btn" class="btn-modal-secondary">Cancel</button>
            <button id="modal-confirm-btn" class="btn-modal-danger">Yes, Delete</button>
        `;

        modal.classList.remove('hidden');

        document.getElementById('modal-confirm-btn').onclick = () => {
            modal.classList.add('hidden');
            resolve(true);
        };

        document.getElementById('modal-cancel-btn').onclick = () => {
            modal.classList.add('hidden');
            resolve(false);
        };
    });
}


// SCHEDULE TAB
function goToScheduleAndFocus(courseId) {
  // 1. Activate the Schedule tab
  switchTab('schedule-tab');

  // 2. Scroll smoothly to the target schedule row
  setTimeout(() => {
    const targetCard = document.getElementById(courseId);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Brief highlight animation to guide the user's focus
      targetCard.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      targetCard.style.borderColor = '#f97316';
      targetCard.style.boxShadow = '0 0 15px rgba(249, 115, 22, 0.4)';

      setTimeout(() => {
        targetCard.style.borderColor = '#e2e8f0';
        targetCard.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.03)';
      }, 1800);
    }
  }, 100);
}


// Example Tab Switch Handler
document.querySelectorAll('.nav-link, [data-tab]').forEach(tabBtn => {
  tabBtn.addEventListener('click', (e) => {
    const targetTab = e.target.getAttribute('data-tab') || e.target.innerText.toLowerCase();
    
    if (targetTab.includes('schedule')) {
      renderScheduleTab(); // Re-renders schedule view with latest dates/prices from Admin
    }
  });
});

// SYNC TAB SWITCHING WITH URL HASH FRAGMENTS ---




// --- RENDER SCHEDULE TAB (STATIC CATEGORY HEADERS) ---
function renderScheduleTab() {
  const container = document.getElementById('schedule-container') || document.querySelector('.schedule-container');
  if (!container) return;

  const currentCourses = courses || [];

  // Static Category Banners definition
  const categories = [
    { key: 'stcw', title: 'STCW-MARINA TRAINING COURSES' },
    { key: 'inhouse', title: 'IN-HOUSE MARITIME TRAINING COURSES' },
    { key: 'professional', title: 'PROFESSIONAL DEVELOPMENT COURSES' },
    { key: 'passenger', title: 'PASSENGER SHIP COURSES' }
  ];

  let fullHtml = '';

  categories.forEach(cat => {
    // 1. Add Category Header Banner
    fullHtml += `
      <div class="schedule-category-header">
        <h2>${cat.title}</h2>
        <h2 class="category-divider-title">
      </div>
    `;

    // 2. Filter courses for this category
    const categoryCourses = currentCourses.filter(c => (c.category || 'stcw').toLowerCase() === cat.key);

    if (categoryCourses.length === 0) {
      fullHtml += `<div class="schedule-empty-row"><p>No schedule available for this category.</p></div>`;
    } else {
      // 3. Render course rows inside this category
      const courseRows = categoryCourses.map((course, index) => {
        const datesList = Array.isArray(course.schedules) && course.schedules.length > 0
          ? course.schedules.map(s => `<li>${s}</li>`).join('')
          : '<li>Schedule to be announced</li>';

        const walkInLink = course.googleFormUrl || course.enrollLink || '#';
        const freshGradLink = course.gradFormUrl || course.freshGradLink;

        let actionButtonsHtml = '';
        if (freshGradLink) {
          actionButtonsHtml = `
            <div class="schedule-card-action dual-btn">
              <button class="btn-enroll-orange" onclick="window.open('${walkInLink}', '_blank')">
                <i class="fa-solid fa-file-signature"></i> Enroll as Walk-in
              </button>
              <button class="btn-enroll-navy" onclick="window.open('${freshGradLink}', '_blank')">
                <i class="fa-solid fa-graduation-cap"></i> Enroll as DMMA Fresh Grad
              </button>
            </div>`;
        } else {
          actionButtonsHtml = `
            <div class="schedule-card-action">
              <button class="btn-enroll-orange" onclick="window.open('${walkInLink}', '_blank')">
                Enroll Now
              </button>
            </div>`;
        }

        const bgClass = index % 2 === 0 ? 'bg-accent' : 'bg-white';

        return `
          <div class="schedule-card-row ${bgClass}">
            <div class="schedule-card-content">
              <div class="schedule-card-header">
                <span class="badge-mandatory">${course.fee || 'STCW Mandatory'}</span>
              </div>
              <h3 class="course-title">${course.title || 'Untitled Course'}</h3>
              <p class="course-duration"><i class="fa-regular fa-clock"></i> Duration: ${course.duration || 'N/A'}</p>
              <div class="course-dates">
                <span class="dates-label">Upcoming Dates:</span>
                <ul>${datesList}</ul>
              </div>
            </div>
            ${actionButtonsHtml}
          </div>`;
      }).join('');

      fullHtml += courseRows;
    }
  });

  container.innerHTML = fullHtml;
}

// --- RENDER STANDARD COURSES TAB & ADMIN LIST ---
function renderCourses() {
  const grid = document.getElementById('courses-grid');
  const homeGrid = document.getElementById('home-featured-courses');
  const adminList = document.getElementById('admin-courses-list');

  const courseCardHtml = (course) => `
    <div class="card">
      <div>
        <div class="card-header">
          <span class="tag">${course.category || 'STCW Mandatory'}</span>
          <span class="fee">${course.fee || '₱0.00'}</span>
        </div>
        <h3>${course.title}</h3>
        <p class="schedule"><i class="fa-regular fa-clock"></i> Duration: ${course.duration}</p>
        <div style="font-size:0.8125rem; color:var(--text-muted); margin-bottom:1rem;">
          <strong>Upcoming Dates:</strong>
          ${
            Array.isArray(course.schedules) && course.schedules.length > 0
              ? course.schedules.map(s => `<div style="margin-top:2px;">• ${s}</div>`).join('')
              : `<div style="margin-top:2px;">• Schedule to be announced</div>`
          }
        </div>
      </div>
      <a href="${course.googleFormUrl || '#'}" target="_blank" class="btn btn-primary">
        <i class="fa-solid fa-file-pen"></i> Enroll Now
      </a>
    </div>
  `;

  if (grid) grid.innerHTML = courses.map(courseCardHtml).join('');
  if (homeGrid) homeGrid.innerHTML = courses.slice(0, 2).map(courseCardHtml).join('');

  if (adminList) {
  adminList.innerHTML = courses.map(c => `
    <div class="admin-list-item">
      <div class="admin-course-info">
        <strong>${c.title} (${c.duration})</strong>
        <p style="font-size:0.75rem; color:var(--text-muted);">
          Schedules: ${Array.isArray(c.schedules) ? c.schedules.join(' | ') : 'N/A'}
        </p>
      </div>
      <div class="admin-actions">
        <button class="btn btn-secondary btn-sm" onclick="editCourse(${c.id})">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse(${c.id})">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}
}

function saveAndSyncCourses() {
  // Save updated array to browser storage
  localStorage.setItem('mtac_courses', JSON.stringify(courses));

  // FORCE ALL VIEWS TO RE-RENDER IMMEDIATELY
  renderScheduleTab(); 
  if (typeof renderFeaturedTrainings === 'function') renderFeaturedTrainings();
  if (typeof renderAdminList === 'function') renderAdminList();
}


// --- ADMIN MULTIPLE SCHEDULE INPUTS LOGIC ---
function initScheduleInputs(existingSchedules = ['']) {
  const listContainer = document.getElementById('schedules-input-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  existingSchedules.forEach(sched => {
    addScheduleInputField(sched);
  });
}

function addScheduleInputField(value = '') {
  const listContainer = document.getElementById('schedules-input-list');
  const div = document.createElement('div');
  div.className = 'schedule-item-row';
  div.innerHTML = `
    <input type="text" class="course-schedule-item" placeholder="e.g. September 14 - 18, 2026" value="${value}" required />
    <button type="button" class="icon-btn danger" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
  `;
  listContainer.appendChild(div);
}



// --- GALLERY MANAGEMENT ---
// Global array for loaded gallery items
let gallery = [];

// 1. Fetch images from Supabase
async function loadGalleryFromDatabase() {
    try {
        const { data, error } = await db
            .from('Gallery')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching gallery:', error);
            return;
        }

        gallery = data || [];
        renderGallery();
    } catch (err) {
        console.error('Gallery database error:', err);
    }
}

// 2. Render Gallery for public and admin views
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const adminGrid = document.getElementById('admin-gallery-grid');

    if (grid) {
        grid.innerHTML = gallery.map(item => `
            <div class="gallery-card">
                <img src="${item.url}" alt="${item.caption || ''}">
                <p>${item.caption || ''}</p>
            </div>
        `).join('');
    }

    if (adminGrid) {
        adminGrid.innerHTML = gallery.map(item => `
            <div class="thumb-card" style="position: relative;">
                <img src="${item.url}" alt="${item.caption || 'Photo'}">
                
                ${item.isUploading ? `
                    <div class="thumb-loading-overlay">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                    </div>
                ` : `
                    <button class="icon-btn danger" onclick="deletePhoto(${item.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `}
            </div>
        `).join('');
    }
}

// Function to display the chosen filename in the text box immediately upon selection
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('photo-url').value = file.name;
    }
}

// GALLERY HANDLE UPLOADS
async function handleUploadPhoto(e) {
    if (e) e.preventDefault();

    const urlInput = document.getElementById('photo-url').value.trim();
    const caption = document.getElementById('photo-caption').value.trim();
    const fileInput = document.getElementById('photo-file');
    const submitBtn = e ? e.target.querySelector('button[type="submit"]') : null;
    
    let finalUrl = urlInput;
    let localPreviewUrl = '';

    if (fileInput && fileInput.files[0]) {
        localPreviewUrl = URL.createObjectURL(fileInput.files[0]);
    } else if (!urlInput) {
        alert('Please provide an Image URL or select an image file.');
        return;
    }

    if (submitBtn) submitBtn.disabled = true;

    // 1. Create temporary item with 'isUploading: true' flag
    const tempId = Date.now();
    const tempItem = { 
        id: tempId, 
        url: localPreviewUrl || urlInput, 
        caption: caption,
        isUploading: true 
    };
    
    gallery.unshift(tempItem);
    renderGallery(); // Displays card with spinner overlay instantly!

    try {
        // 2. Upload to Supabase Storage
        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
            const filePath = `${Date.now()}_${cleanFileName}`;

            const { data: uploadData, error: uploadError } = await db.storage
                .from('gallery-images')
                .upload(filePath, file);

            if (uploadError) throw new Error('Upload error: ' + uploadError.message);

            const { data: publicUrlData } = db.storage
                .from('gallery-images')
                .getPublicUrl(filePath);

            finalUrl = publicUrlData.publicUrl;
        }

        // 3. Save to Supabase Database
        const { data: insertedData, error: insertError } = await db
            .from('Gallery')
            .insert([{ url: finalUrl, caption: caption }])
            .select();

        if (insertError) throw new Error('Database error: ' + insertError.message);

        // 4. Replace temp item with real record (removes 'isUploading' flag automatically)
        if (insertedData && insertedData[0]) {
            const index = gallery.findIndex(item => item.id === tempId);
            if (index !== -1) {
                gallery[index] = insertedData[0]; // Real data from Supabase
            }
        }

        // Reset inputs
        document.getElementById('photo-url').value = '';
        document.getElementById('photo-caption').value = '';
        if (fileInput) fileInput.value = '';

    } catch (err) {
        alert(err.message || 'An error occurred during upload.');
        console.error(err);
        gallery = gallery.filter(item => item.id !== tempId);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        renderGallery(); // Re-render gallery: loading spinner disappears, delete icon appears!
    }
}

// Helper Promise to trigger your custom HTML modal
function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const messageEl = document.getElementById('custom-modal-message');
        const confirmBtn = document.getElementById('custom-modal-confirm');
        const cancelBtn = document.getElementById('custom-modal-cancel');

        if (!modal) {
            resolve(confirm(message)); // Fallback to browser confirm if HTML is missing
            return;
        }

        if (messageEl) messageEl.textContent = message;
        modal.style.display = 'flex';

        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };

        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };
    });
}

// 4. Delete photo from Supabase
async function deletePhoto(id) {
    const isConfirmed = await showCustomConfirm('Are you sure you want to delete this photo?');
    if (!isConfirmed) return;

    try {
        const { error } = await db
            .from('Gallery')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            alert('Failed to delete image: ' + error.message);
            console.error('Supabase Delete Error:', error);
            return;
        }

        // Refresh gallery
        await loadGalleryFromDatabase();
    } catch (err) {
        console.error('Delete photo error:', err);
    }
}

// Universal Confirmation Modal DELETE MESSAGE POPUP BOX
function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const messageEl = document.getElementById('custom-modal-message');
        const confirmBtn = document.getElementById('custom-modal-confirm');
        const cancelBtn = document.getElementById('custom-modal-cancel');

        // Fallback to browser confirm if HTML elements are not found
        if (!modal || !confirmBtn || !cancelBtn) {
            console.warn('Custom modal elements not found in HTML. Falling back to native confirm.');
            resolve(confirm(message));
            return;
        }

        if (messageEl) {
            messageEl.textContent = message;
        }

        modal.style.display = 'flex';

        // Clean up event handlers to prevent multiple firings
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;

        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };

        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };
    });
}

// 1. Delete Photo Function
async function deletePhoto(id) {
    console.log('deletePhoto called with ID:', id);
    
    const isConfirmed = await showCustomConfirm('Are you sure you want to delete this photo?');
    if (!isConfirmed) return;

    try {
        const { error } = await db
            .from('Gallery')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            alert('Failed to delete image: ' + error.message);
            console.error('Supabase Delete Error:', error);
            return;
        }

        await loadGalleryFromDatabase();
    } catch (err) {
        console.error('Delete photo error:', err);
    }
}

// DELETE COURSE IN ADMIN MODE
async function deleteCourse(id) {
    // Show custom red/warning confirm popup
    const confirmed = await showConfirm('Are you sure you want to delete this course permanently?');
    if (!confirmed) return;

    try {
        const { error } = await db
            .from('Course')
            .delete()
            .eq('id', parseInt(id));

        if (error) throw error;

        await showAlert('Course successfully deleted!', 'danger');
        await loadCoursesFromDatabase();

    } catch (err) {
        await showAlert('Failed to delete course: ' + err.message, 'danger');
    }
}

// EDIT COURSE IN ADMIN MODE
function editCourse(id) {
  // 1. Find course in global array by ID
  const course = courses.find(item => item.id == id);
  if (!course) {
    alert('Course not found!');
    return;
  }

  // 2. Populate form fields
  document.getElementById('editing-course-id').value = course.id;
  document.getElementById('course-title').value = course.title || '';
  document.getElementById('course-duration').value = course.duration || '';
  document.getElementById('course-fee').value = course.fee || '';
  document.getElementById('course-form-url').value = course.googleFormUrl || course.enrollLink || '';
  
  if (document.getElementById('course-grad-url')) {
    document.getElementById('course-grad-url').value = course.gradFormUrl || course.freshGradLink || '';
  }

  // Populate category dropdown field
  const categorySelect = document.getElementById('course-category');
  if (categorySelect) {
    categorySelect.value = course.category || 'stcw';
  }

  // 3. Populate schedule inputs dynamically
  const scheduleDates = Array.isArray(course.schedules) && course.schedules.length > 0
    ? course.schedules
    : [''];

  if (typeof initScheduleInputs === 'function') {
    initScheduleInputs(scheduleDates);
  }

  // 4. Update submit button text to indicate editing mode
  const submitBtn = document.getElementById('course-submit-btn');
  if (submitBtn) submitBtn.textContent = 'Update Course';

  const cancelBtn = document.getElementById('course-cancel-btn');
  if (cancelBtn) cancelBtn.style.display = 'block';

  // 5. Scroll smoothly up to the Admin form
  const formElement = document.getElementById('course-form');
  if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// Function to clear textboxes and reset form state
function resetCourseForm() {
  const formElement = document.getElementById('course-form');
  if (formElement) formElement.reset();

  // Clear hidden editing ID
  const editingIdInput = document.getElementById('editing-course-id');
  if (editingIdInput) editingIdInput.value = '';

  // Reset schedules to 1 empty input row
  if (typeof initScheduleInputs === 'function') {
    initScheduleInputs(['']);
  }

  // Restore Submit Button text
  const submitBtn = document.getElementById('course-submit-btn');
  if (submitBtn) submitBtn.textContent = 'Publish Course';

  // Hide Cancel Button
  const cancelBtn = document.getElementById('course-cancel-btn');
  if (cancelBtn) cancelBtn.style.display = 'none';
}

// Event listener for Cancel Edit button
document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.getElementById('course-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetCourseForm);
  }
});




// MESSENGER CTA BUBBLE
document.addEventListener('DOMContentLoaded', () => {
    const messengerCta = document.querySelector('.messenger-cta');
    const footer = document.querySelector('footer');

    if (messengerCta && footer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    messengerCta.classList.add('icon-only');
                } else {
                    messengerCta.classList.remove('icon-only');
                }
            });
        }, { threshold: 0.15 });

        observer.observe(footer);
    }
});


// TICKET STACK FUNCTION ARRAY
// Dataset with full multi-paragraph seaman stories
const seamanStories = [
  {
    id: "#00001",
    name: "Brian C. Estologa",
    rank: "Deck Cadet",
    vessel: "MV Pacific Star",
    date: "MAR 2026",
    vesselType: "Bulk Carrier",
    quote: "Every expert was once a beginner. Do not fear mistakes; fear the absence of trying. The harder you fall, the higher you rise.",
    qrMessage: "MTAC ENGINE ROOM SENSOR:\nAmbient Temp: 48°C\nSweat Produced: 3 Liters\nNoise Level: WHAT? I CAN'T HEAR YOU!\nCurrent Mood: Sauna session complete! 🔧🔥",
    image: "img/stories/brian.png",
    paragraphs: [
      "My journey in the maritime industry is a story of gratitude, hard work, and unwavering determination. Life was not always easy, and there was a time when I struggled to find my true path. I once dreamed of becoming a Law Officer, but fate had different plans for me. Facing that reality felt like a failure at first, but it turned out to be a blessing in disguise. I decided to embrace the maritime world, and that decision changed my life forever. As a proud Company Scholar of Bouvet Shipping Management Corporation, I was blessed with invaluable support that covered my education needs and guided me every step of the way. From my cadetship and training days to my actual deployment, their guidance helped me transition smoothly into becoming a professional seafarer. ",
      "I also owe my competence and confidence to DMMA Maritime Training Center, where I acquired the technical knowledge and practical skills that made me future-ready and capable of handling the challenges of the sea. Behind every achievement stands the unwavering love and encouragement of my family, who are my greatest inspiration and strength. Today, as I sail the oceans and fulfill my duties onboard, I carry with me the discipline, excellence, and values instilled in me. I may have taken a different road than I first planned, but I know now that the sea is truly where I belong. I am committed to growing further in my career and becoming a top-tier officer in the years to come. "
    ]
  },
  {
    id: "#00002",
    name: "D/C Renz Quion Puzon",
    rank: "Master Mariner",
    vessel: "MV Ocean Guardian",
    date: "OCT 2024",
    vesselType: "Container Ship",
    quote: "The sea rewards those who respect its power and master their craft.",
    image: "img/stories/renz.png",
    paragraphs: [
      "Navigating through the North Atlantic during peak winter taught me true resilience. The seas were rough, with swelling waves hitting our bow continuously for three days.",
      "Maintaining morale on deck during severe weather is just as vital as managing navigation instruments. Seeing the sun break through the clouds after days of storm reminded everyone onboard why we chose this noble profession."
    ]
  },
  {
    id: "#00003",
    name: "Leigh Mar Melvin Angelo F. Maza",
    rank: "Chief Engineer",
    vessel: "MT Blue Horizon",
    date: "JAN 2025",
    vesselType: "Oil Tanker",
    quote: "Precision and teamwork in the engine room keep the heart of the ship beating.",
    image: "img/stories/leighmar.png",
    paragraphs: [
      "Working inside an engine room operating under high ambient temperatures requires extreme discipline and constant vigil. Mid-voyage, our team encountered an issue with an auxiliary generator.",
      "By relying on the rigorous training we underwent at DMMA MTAC, we systematically diagnosed and repaired the unit without losing critical power. The accomplishment reinforced the value of practical simulation training."
    ]
  },
  {
    id: "#00004",
    name: "Jason R. Estremos",
    rank: "Master Mariner",
    vessel: "MV Ocean Guardian",
    date: "OCT 2024",
    vesselType: "Container Ship",
    quote: "The sea rewards those who respect its power and master their craft.",
    image: "img/stories/jason.png",
    paragraphs: [
      "Navigating through the North Atlantic during peak winter taught me true resilience. The seas were rough, with swelling waves hitting our bow continuously for three days.",
      "Maintaining morale on deck during severe weather is just as vital as managing navigation instruments. Seeing the sun break through the clouds after days of storm reminded everyone onboard why we chose this noble profession."
    ]
  },{
    id: "#00005",
    name: "D/C Renz Quion Puzon",
    rank: "Master Mariner",
    vessel: "MV Ocean Guardian",
    date: "OCT 2024",
    vesselType: "Container Ship",
    quote: "The sea rewards those who respect its power and master their craft.",
    image: "img/stories/renz.png",
    paragraphs: [
      "Navigating through the North Atlantic during peak winter taught me true resilience. The seas were rough, with swelling waves hitting our bow continuously for three days.",
      "Maintaining morale on deck during severe weather is just as vital as managing navigation instruments. Seeing the sun break through the clouds after days of storm reminded everyone onboard why we chose this noble profession."
    ]
  },
];

let currentTicketIndex = 0;

function renderTicketStack() {
  const container = document.getElementById("ticket-stack-container");
  if (!container) return;
  
  container.innerHTML = "";
  

  seamanStories.forEach((item, index) => {
    const ticketElement = document.createElement("div");
    ticketElement.className = "ticket";
    ticketElement.setAttribute("data-index", index);

    // Build story paragraphs HTML dynamically
    const paragraphsHtml = item.paragraphs.map(p => `<p>${p}</p>`).join("");

    ticketElement.innerHTML = `
      <div class="left">
        <div class="image" style="background-image: url('${item.image}');"></div>
        <div class="admit-one">
          <span>MTAC</span>
          <span>STORIES</span>
        </div>
        <div class="ticket-number">${item.id}</div>
      </div>

      <div class="ticket-info">
        <div class="date">
          <span>${item.vesselType}</span>
          <span style="color:#0284c7;">${item.date}</span>
          <span>VOYAGE</span>
        </div>

        <div class="show-name">
          <h1>${item.name}</h1>
          <span>${item.rank} • ${item.vessel}</span>
        </div>

        <div class="story-body">
          <blockquote>"${item.quote}"</blockquote>
          ${paragraphsHtml}
        </div>

        <div class="location">
          <span>DMMA MTAC</span>
          <span>&#9875;</span>
          <span>Maritime Stories</span>
        </div>
      </div>

      <div class="right">
        <div class="right-info-container">
          <span style="font-size: 0.9rem; font-weight:700; color:#1e293b;">${item.rank}</span>
          <span style="font-size: 0.8rem; color:#64748b;">${item.vessel}</span>
        </div>
        <div class="barcode">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.qrMessage)}" alt="Maritime Easter Egg QR Code" />
        </div>
        <span class="ticket-number" style="font-size:0.8rem; color:#94a3b8;">${item.id}</span>
      </div>
    `;

    // Click active card to cycle to the next story
    ticketElement.addEventListener("click", () => {
      nextTicket();
    });

    container.appendChild(ticketElement);
  });

  updateStackClasses();
}

function updateStackClasses() {
  const tickets = document.querySelectorAll("#ticket-stack-container .ticket");
  const total = tickets.length;

  tickets.forEach((ticket, idx) => {
    ticket.classList.remove("active", "next-1", "next-2", "hidden-stack");

    const offset = (idx - currentTicketIndex + total) % total;

    if (offset === 0) {
      ticket.classList.add("active");
    } else if (offset === 1) {
      ticket.classList.add("next-1");
    } else if (offset === 2) {
      ticket.classList.add("next-2");
    } else {
      ticket.classList.add("hidden-stack");
    }
  });

  const badge = document.getElementById("ticket-counter-badge");
  if (badge) {
    badge.textContent = `Story ${currentTicketIndex + 1} of ${total}`;
  }
}

function nextTicket() {
  currentTicketIndex = (currentTicketIndex + 1) % seamanStories.length;
  updateStackClasses();
}

document.addEventListener("DOMContentLoaded", renderTicketStack);



