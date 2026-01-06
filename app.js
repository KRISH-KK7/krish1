/* CampusHub Prototype — Modular State & Components */

// Simple storage (mock). Replace with backend APIs in production.
const store = {
  role: "student",
  courses: [
    { id: "cse101", name: "CSE101 — Programming Fundamentals", color: "#4ea1ff", tags: ["coding", "first-year"] },
    { id: "mat202", name: "MAT202 — Linear Algebra", color: "#37c56c", tags: ["math", "core"] },
    { id: "phy150", name: "PHY150 — Mechanics", color: "#ffcc66", tags: ["physics", "lab"] },
  ],
  assignments: [
    { id: "a1", courseId: "cse101", title: "Loops & Arrays Lab", due: dateOffset(3), status: "pending", tags: ["lab", "coding"], description: "Solve 5 problems using loops over arrays." },
    { id: "a2", courseId: "mat202", title: "Matrix Factorization Sheet", due: dateOffset(5), status: "pending", tags: ["homework", "math"], description: "Practice LU and QR problems from sheet 3." },
    { id: "a3", courseId: "phy150", title: "Projectile Motion Report", due: dateOffset(-1), status: "overdue", tags: ["lab", "report"], description: "Analyze trajectory data and submit PDF." },
  ],
  notices: [
    { id: "n1", courseId: "cse101", title: "Lab timing update", body: "Lab moved to Thursday 2 PM.", createdAt: today(), tags: ["schedule"] },
    { id: "n2", courseId: "mat202", title: "Quiz reminder", body: "Syllabus: Chapters 1–3. Bring calculator.", createdAt: today(-1), tags: ["exam", "reminder"] },
  ],
  faculty: [
    { id: "f1", name: "Dr. Ananya Rao", dept: "Computer Science", email: "ananya.rao@campushub.edu", courses: ["CSE101"], office: "Block A-302" },
    { id: "f2", name: "Prof. Karan Mehta", dept: "Mathematics", email: "karan.mehta@campushub.edu", courses: ["MAT202"], office: "Block B-210" },
    { id: "f3", name: "Dr. Neha Kulkarni", dept: "Physics", email: "neha.kulkarni@campushub.edu", courses: ["PHY150"], office: "Block D-115" },
  ],
  events: [
    { id: "e1", title: "MAT202 Quiz", date: dateOffset(5), courseId: "mat202" },
    { id: "e2", title: "CSE101 Lab", date: dateOffset(3), courseId: "cse101" },
  ],
  tags: ["coding", "first-year", "math", "core", "physics", "lab", "homework", "exam", "reminder", "report", "schedule"],
  reminders: [],
  chatHistory: [],
  selectedCourseId: null,
};

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0,0,0,0);
  return d;
}
function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function formatDate(d) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function byId(id) { return document.getElementById(id); }

/* Initialization */
document.addEventListener("DOMContentLoaded", () => {
  renderCourses();
  renderTags();
  bindTabs();
  bindGlobalActions();
  renderDashboard();
  renderAssignments();
  renderNotices();
  renderFaculty();
  renderCalendar(new Date());
  setupAI();
});

/* Sidebar — Courses */
function renderCourses() {
  const ul = byId("courseList");
  ul.innerHTML = "";
  store.courses.forEach(c => {
    const li = document.createElement("li");
    li.setAttribute("data-id", c.id);
    li.innerHTML = `
      <div class="course-pill">
        <span class="dot" style="background:${c.color}"></span>
        <span>${c.name}</span>
      </div>
      <span class="badge">${c.tags.slice(0,2).join(", ")}</span>
    `;
    li.addEventListener("click", () => {
      store.selectedCourseId = c.id;
      document.querySelectorAll(".course-list li").forEach(n => n.classList.remove("active"));
      li.classList.add("active");
      // Filter panels by selected course
      renderAssignments();
      renderNotices();
      renderDashboard();
      renderCalendar(currentMonthRef);
    });
    ul.appendChild(li);
  });

  byId("addCourseBtn").onclick = () => openModal("Create new space", courseForm(), () => {
    const name = byId("f_course_name").value.trim();
    if (!name) return alert("Course name required");
    const id = name.toLowerCase().replace(/\s+/g, "").slice(0, 8) + Math.floor(Math.random()*1000);
    const color = randomColor();
    store.courses.push({ id, name, color, tags: [] });
    renderCourses();
  });
}
function randomColor() {
  const palette = ["#4ea1ff","#37c56c","#ffcc66","#ff6b6b","#b784ff","#5dd1b7"];
  return palette[Math.floor(Math.random()*palette.length)];
}
function courseForm() {
  return `
    <label class="card-row">
      <span>Course name</span>
      <input id="f_course_name" type="text" placeholder="e.g., ECE210 — Signals" />
    </label>
  `;
}

/* Sidebar — Tags */
function renderTags() {
  const cloud = byId("tagCloud");
  cloud.innerHTML = "";
  store.tags.forEach(t => {
    const b = document.createElement("button");
    b.className = "tag";
    b.textContent = `#${t}`;
    b.addEventListener("click", () => {
      document.querySelectorAll(".tag").forEach(n => n.classList.remove("active"));
      b.classList.add("active");
      renderAssignments({ tag: t });
      renderNotices({ tag: t });
    });
    cloud.appendChild(b);
  });
}

/* Tabs */
function bindTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    byId(`${tab.dataset.tab}Panel`).classList.add("active");
  }));
}

/* Topbar actions */
function bindGlobalActions() {
  byId("toggleRole").onclick = () => {
    store.role = store.role === "student" ? "faculty" : "student";
    byId("toggleRole").textContent = capitalize(store.role);
    renderAssignments();
    renderDashboard();
  };
  byId("searchBtn").onclick = handleGlobalSearch;
  byId("globalSearch").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleGlobalSearch();
  });

  document.querySelectorAll(".qa-btn").forEach(btn => {
    btn.onclick = () => {
      const action = btn.dataset.action;
      if (action === "newAssignment") byId("newAssignmentBtn").click();
      if (action === "newNotice") byId("newNoticeBtn").click();
      if (action === "newEvent") byId("newEventBtn").click();
    };
  });
}
function handleGlobalSearch() {
  const q = byId("globalSearch").value.trim().toLowerCase();
  if (!q) return;
  const results = [
    ...store.courses.filter(c => c.name.toLowerCase().includes(q)),
    ...store.assignments.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)),
    ...store.notices.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)),
    ...store.faculty.filter(f => f.name.toLowerCase().includes(q) || f.dept.toLowerCase().includes(q)),
  ];
  openModal(`Search results (${results.length})`, resultsList(results), null, true);
}
function resultsList(items) {
  if (items.length === 0) return `<p>No results found.</p>`;
  return items.map(item => {
    if ("dept" in item) return `<div class="timeline-item"><strong>Faculty:</strong> ${item.name} — ${item.dept}</div>`;
    if ("due" in item) return `<div class="timeline-item"><strong>Assignment:</strong> ${item.title} — due ${formatDate(item.due)}</div>`;
    if ("createdAt" in item) return `<div class="timeline-item"><strong>Notice:</strong> ${item.title} — ${item.body}</div>`;
    return `<div class="timeline-item"><strong>Course:</strong> ${item.name}</div>`;
  }).join("");
}

/* Dashboard */
function renderDashboard() {
  const totalAssignments = store.assignments.length;
  const pending = store.assignments.filter(a => a.status === "pending").length;
  const overdue = store.assignments.filter(a => a.status === "overdue").length;
  const courseFilter = store.selectedCourseId;

  const stats = byId("overviewStats");
  stats.innerHTML = "";
  const rows = [
    { label: "Total assignments", value: totalAssignments },
    { label: "Pending", value: pending },
    { label: "Overdue", value: overdue },
    { label: "Notices", value: store.notices.length },
  ];
  rows.forEach(r => {
    const div = document.createElement("div");
    div.className = "stat-row";
    div.innerHTML = `<span>${r.label}${courseFilter ? " (filtered)" : ""}</span><strong>${r.value}</strong>`;
    stats.appendChild(div);
  });

  const upcoming = store.assignments
    .filter(a => a.status !== "submitted")
    .filter(a => !courseFilter || a.courseId === courseFilter)
    .sort((a, b) => a.due - b.due)
    .slice(0, 5);

  byId("upcomingDeadlines").innerHTML = upcoming.map(a =>
    `<li>
      <div class="card-row">
        <span>${a.title}</span>
        <span class="badge ${badgeByStatus(a.status)}">${a.status}</span>
      </div>
      <div class="timeline-meta"><span>Due: ${formatDate(a.due)}</span><span>#${a.tags.join(" #")}</span></div>
    </li>`
  ).join("");

  const recent = store.notices
    .filter(n => !courseFilter || n.courseId === courseFilter)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  byId("recentNotices").innerHTML = recent.map(n =>
    `<li>
      <div class="card-row"><strong>${n.title}</strong><span class="badge">#${n.tags.join(" #")}</span></div>
      <div class="timeline-meta"><span>${formatDate(n.createdAt)}</span></div>
      <div>${n.body}</div>
    </li>`
  ).join("");

  generateSmartReminders();
}
function badgeByStatus(s) {
  if (s === "pending") return "warning";
  if (s === "submitted") return "success";
  if (s === "overdue") return "danger";
  return "";
}
function generateSmartReminders() {
  const reminders = [];
  const now = new Date();
  store.assignments.forEach(a => {
    const daysLeft = Math.ceil((a.due - now) / (1000*60*60*24));
    if (a.status === "pending" && daysLeft <= 3 && daysLeft >= 0) {
      reminders.push({ text: `Finish "${a.title}" — only ${daysLeft} day(s) left`, type: "deadline" });
    }
    if (a.status === "overdue") {
      reminders.push({ text: `Overdue: "${a.title}". Submit as soon as possible.`, type: "overdue" });
    }
  });
  store.events.forEach(e => {
    const daysLeft = Math.ceil((e.date - now) / (1000*60*60*24));
    if (daysLeft <= 7 && daysLeft >= 0) {
      reminders.push({ text: `Upcoming event: ${e.title} in ${daysLeft} day(s)`, type: "event" });
    }
  });
  store.reminders = reminders;
  byId("smartReminders").innerHTML = reminders.map(r =>
    `<li><span class="badge ${r.type === "overdue" ? "danger" : r.type === "deadline" ? "warning" : "success"}">${capitalize(r.type)}</span> ${r.text}</li>`
  ).join("");
}

/* Assignments */
function renderAssignments({ tag } = {}) {
  const container = byId("assignmentList");
  container.innerHTML = "";

  const filter = byId("assignmentFilter").value;
  const byRole = store.role;

  let list = store.assignments
    .filter(a => (!store.selectedCourseId || a.courseId === store.selectedCourseId))
    .filter(a => (!tag || a.tags.includes(tag)));

  if (filter !== "all") list = list.filter(a => a.status === filter);

  list.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-row">
        <strong>${a.title}</strong>
        <span class="badge ${badgeByStatus(a.status)}">${capitalize(a.status)}</span>
      </div>
      <div class="timeline-meta">
        <span>Course: ${courseName(a.courseId)}</span>
        <span>Due: ${formatDate(a.due)}</span>
      </div>
      <p>${a.description}</p>
      <div class="card-row">
        ${byRole === "student"
          ? `<button class="secondary" data-action="markSubmitted" data-id="${a.id}">Mark submitted</button>`
          : `<button class="secondary" data-action="editAssignment" data-id="${a.id}">Edit</button>`}
        <div>
          ${a.tags.map(t => `<span class="tag">#${t}</span>`).join(" ")}
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  byId("assignmentFilter").onchange = () => renderAssignments();
  byId("newAssignmentBtn").onclick = () => openModal("New assignment", assignmentForm(), () => {
    const payload = readAssignmentForm();
    store.assignments.push(payload);
    renderAssignments();
    renderDashboard();
  });

  // action buttons
  container.querySelectorAll("button[data-action]").forEach(btn => {
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    btn.onclick = () => {
      if (action === "markSubmitted") {
        const a = store.assignments.find(x => x.id === id);
        if (!a) return;
        a.status = "submitted";
        renderAssignments();
        renderDashboard();
      }
      if (action === "editAssignment") {
        const a = store.assignments.find(x => x.id === id);
        openModal("Edit assignment", assignmentForm(a), () => {
          const updated = readAssignmentForm(a.id);
          Object.assign(a, updated);
          renderAssignments();
          renderDashboard();
        });
      }
    };
  });
}
function assignmentForm(a = {}) {
  return `
    <label class="card-row"><span>Title</span><input id="f_title" type="text" value="${a.title || ""}" /></label>
    <label class="card-row"><span>Course</span>
      <select id="f_course">${store.courses.map(c => `<option value="${c.id}" ${a.courseId===c.id?"selected":""}>${c.name}</option>`).join("")}</select>
    </label>
    <label class="card-row"><span>Due date</span><input id="f_due" type="date" value="${a.due ? toInputDate(a.due) : toInputDate(dateOffset(2))}" /></label>
    <label class="card-row"><span>Description</span><input id="f_desc" type="text" value="${a.description || ""}" /></label>
    <label class="card-row"><span>Tags (comma)</span><input id="f_tags" type="text" value="${(a.tags || []).join(", ")}" /></label>
  `;
}
function readAssignmentForm(id = `a${Date.now()}`) {
  const title = byId("f_title").value.trim();
  const courseId = byId("f_course").value;
  const due = new Date(byId("f_due").value);
  const description = byId("f_desc").value.trim();
  const tags = byId("f_tags").value.split(",").map(s => s.trim()).filter(Boolean);
  return { id, title, courseId, due, status: "pending", description, tags };
}
function toInputDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function courseName(id) {
  return store.courses.find(c => c.id === id)?.name || "Unknown";
}

/* Notices */
function renderNotices({ tag } = {}) {
  const container = byId("noticeList");
  container.innerHTML = "";
  const list = store.notices
    .filter(n => (!store.selectedCourseId || n.courseId === store.selectedCourseId))
    .filter(n => (!tag || n.tags.includes(tag)))
    .sort((a, b) => b.createdAt - a.createdAt);

  list.forEach(n => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `
      <div class="card-row">
        <strong>${n.title}</strong>
        <span class="badge">#${n.tags.join(" #")}</span>
      </div>
      <div class="timeline-meta">
        <span>${formatDate(n.createdAt)}</span>
        <span>${courseName(n.courseId)}</span>
      </div>
      <div>${n.body}</div>
    `;
    container.appendChild(div);
  });

  byId("newNoticeBtn").onclick = () => openModal("Post notice", noticeForm(), () => {
    const payload = readNoticeForm();
    store.notices.push(payload);
    renderNotices();
    renderDashboard();
  });
}
function noticeForm() {
  return `
    <label class="card-row"><span>Title</span><input id="f_ntitle" type="text" /></label>
    <label class="card-row"><span>Course</span>
      <select id="f_ncourse">${store.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select>
    </label>
    <label class="card-row"><span>Message</span><input id="f_nbody" type="text" /></label>
    <label class="card-row"><span>Tags (comma)</span><input id="f_ntags" type="text" /></label>
  `;
}
function readNoticeForm() {
  return {
    id: `n${Date.now()}`,
    title: byId("f_ntitle").value.trim(),
    courseId: byId("f_ncourse").value,
    body: byId("f_nbody").value.trim(),
    createdAt: new Date(),
    tags: byId("f_ntags").value.split(",").map(s => s.trim()).filter(Boolean),
  };
}

/* Faculty */
function renderFaculty() {
  const container = byId("facultyList");
  container.innerHTML = "";
  store.faculty.forEach(f => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-row"><strong>${f.name}</strong><span class="badge">${f.dept}</span></div>
      <div class="timeline-meta"><span>Email: ${f.email}</span><span>Office: ${f.office}</span></div>
      <div>Courses: ${f.courses.join(", ")}</div>
      <div class="card-row">
        <button class="secondary" data-action="contact" data-email="${f.email}">Contact</button>
        <button class="secondary" data-action="viewCourses" data-id="${f.id}">View courses</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("button[data-action='contact']").forEach(btn => {
    btn.onclick = () => alert(`Contact ${btn.dataset.email}`);
  });
  container.querySelectorAll("button[data-action='viewCourses']").forEach(btn => {
    btn.onclick = () => {
      const f = store.faculty.find(x => x.id === btn.dataset.id);
      openModal(`${f.name} — Courses`, `<div class="timeline">${f.courses.map(c => `<div class="timeline-item">${c}</div>`).join("")}</div>`);
    };
  });
}

/* Calendar */
let currentMonthRef = new Date();
function renderCalendar(refDate) {
  currentMonthRef = refDate;
  const monthLabel = byId("calendarMonth");
  monthLabel.textContent = refDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const grid = byId("calendarGrid");
  grid.innerHTML = "";

  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayIndex = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Weekday headers
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  weekdays.forEach(w => {
    const head = document.createElement("div");
    head.className = "day";
    head.innerHTML = `<div class="date"><strong>${w}</strong></div>`;
    head.style.background = "transparent";
    head.style.border = "none";
    grid.appendChild(head);
  });

  // Empty placeholders
  for (let i = 0; i < startDayIndex; i++) {
    const placeholder = document.createElement("div");
    placeholder.className = "day";
    placeholder.style.visibility = "hidden";
    grid.appendChild(placeholder);
  }

  // Days with events
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "day";
    cell.innerHTML = `<div class="date">${d}</div>`;
    const dateObj = new Date(year, month, d);

    store.events
      .filter(e => (!store.selectedCourseId || e.courseId === store.selectedCourseId))
      .filter(e => sameDay(e.date, dateObj))
      .forEach(e => {
        const ev = document.createElement("div");
        ev.className = "event";
        ev.textContent = e.title;
        cell.appendChild(ev);
      });

    grid.appendChild(cell);
  }

  byId("prevMonthBtn").onclick = () => {
    const d = new Date(currentMonthRef);
    d.setMonth(d.getMonth() - 1);
    renderCalendar(d);
  };
  byId("nextMonthBtn").onclick = () => {
    const d = new Date(currentMonthRef);
    d.setMonth(d.getMonth() + 1);
    renderCalendar(d);
  };
  byId("newEventBtn").onclick = () => openModal("Add event", eventForm(), () => {
    const payload = readEventForm();
    store.events.push(payload);
    renderCalendar(currentMonthRef);
    renderDashboard();
  });
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function eventForm() {
  return `
    <label class="card-row"><span>Title</span><input id="f_etitle" type="text" /></label>
    <label class="card-row"><span>Date</span><input id="f_edate" type="date" value="${toInputDate(new Date())}" /></label>
    <label class="card-row"><span>Course</span>
      <select id="f_ecourse">${store.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}</select>
    </label>
  `;
}
function readEventForm() {
  return {
    id: `e${Date.now()}`,
    title: byId("f_etitle").value.trim(),
    date: new Date(byId("f_edate").value),
    courseId: byId("f_ecourse").value,
  };
}

/* AI Assistant — Summaries & Chatbot (mocked local models) */
function setupAI() {
  byId("summarizeBtn").onclick = () => {
    const text = byId("summaryInput").value.trim();
    const style = byId("summaryStyle").value;
    if (!text) return (byId("summaryOutput").innerHTML = `<p class="muted">Paste content to summarize.</p>`);
    const summary = summarize(text, style);
    byId("summaryOutput").innerHTML = summary;
  };

  byId("chatSendBtn").onclick = () => {
    const q = byId("chatQuery").value.trim();
    if (!q) return;
    pushChat("user", q);
    const reply = chatbotRespond(q);
    pushChat("bot", reply);
    byId("chatQuery").value = "";
  };
}
function summarize(text, style) {
  const keyPoints = extractKeyPoints(text);
  if (style === "bullet") {
    return `<ul>${keyPoints.map(k => `<li>${k}</li>`).join("")}</ul>`;
  }
  if (style === "tl;dr") {
    return `<p><strong>TL;DR:</strong> ${keyPoints.slice(0,3).join("; ")}.</p>`;
  }
  // study outline
  return `
    <ol>
      ${keyPoints.map(k => `<li><strong>Topic:</strong> ${k}</li>`).join("")}
    </ol>
  `;
}
function extractKeyPoints(text) {
  // naive split + scoring
  return text
    .split(/[\.\n]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/\s+/g, " "))
    .slice(0, 8);
}
function pushChat(role, text) {
  store.chatHistory.push({ role, text, time: new Date() });
  const log = byId("chatLog");
  const row = document.createElement("div");
  row.className = `chat-msg ${role}`;
  row.innerHTML = `<div class="bubble"><small>${role === "user" ? "You" : "Assistant"}</small><div>${text}</div></div>`;
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}
function chatbotRespond(q) {
  const lower = q.toLowerCase();

  // simple intents
  if (lower.includes("deadline") || lower.includes("due")) {
    const upcoming = store.assignments
      .filter(a => a.status === "pending")
      .sort((a, b) => a.due - b.due)
      .slice(0, 3)
      .map(a => `${a.title} (${courseName(a.courseId)}) — ${formatDate(a.due)}`);
    return upcoming.length
      ? `Top deadlines: ${upcoming.join(" | ")}`
      : "No upcoming deadlines.";
  }
  if (lower.includes("overdue")) {
    const od = store.assignments.filter(a => a.status === "overdue");
    return od.length ? `Overdue: ${od.map(a => a.title).join(", ")}` : "No overdue items.";
  }
  if (lower.includes("notice") || lower.includes("announcement")) {
    const n = store.notices.slice(-3).map(x => `${x.title} (${courseName(x.courseId)})`).join(" | ");
    return n || "No notices yet.";
  }
  if (lower.includes("where") && lower.includes("find")) {
    return "Use the search bar to find courses, assignments, notices, or faculty. You can also filter by tags.";
  }
  if (lower.includes("help") || lower.includes("commands")) {
    return "Try: 'deadlines', 'overdue', 'notices', 'filter by #tag', 'create assignment'.";
  }
  if (lower.includes("create assignment")) {
    byId("newAssignmentBtn").click();
    return "Opening assignment creation modal.";
  }
  const tagMatch = lower.match(/#([a-z0-9\-]+)/);
  if (tagMatch) {
    renderAssignments({ tag: tagMatch[1] });
    return `Filtered assignments by #${tagMatch[1]}.`;
  }
  return "I can help with deadlines, notices, filtering by tags, or quick actions. Ask me anything campus-related.";
}

/* Modal */
function openModal(title, bodyHtml, onSave = null, noFooter = false) {
  byId("modalTitle").textContent = title;
  byId("modalBody").innerHTML = bodyHtml || "";
  const modal = byId("modal");
  modal.classList.remove("hidden");
  byId("modalClose").onclick = closeModal;
  byId("modalCancel").onclick = closeModal;
  if (noFooter) {
    byId("modalFooter")?.classList.add("hidden");
  }
  byId("modalSave").onclick = () => {
    if (typeof onSave === "function") onSave();
    closeModal();
  };
}
function closeModal() {
  byId("modal").classList.add("hidden");
}
function capitalize(s) { return (s || "").charAt(0).toUpperCase() + (s || "").slice(1); }

/* Accessibility enhancements */
document.addEventListener("keydown", (e) => {
  // Escape closes modal
  if (e.key === "Escape") {
    const modal = byId("modal");
    if (modal && !modal.classList.contains("hidden")) closeModal();
  }
});
