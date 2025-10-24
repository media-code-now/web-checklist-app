/* ---------- Multi-Page Web Checklist Application ---------- */
const STORAGE_KEY = "prelaunch-checklist-v2";

const defaultTemplate = [
  {
    title: "Strategy & Setup",
    items: [
      "Domain is live, connected, and SSL certificate is active (HTTPS)",
      "All DNS records (A, CNAME, MX, SPF, DKIM, DMARC) are verified", 
      "Website hosting is stable and loading time < 3 seconds",
      "CMS and plugins are updated to latest versions",
      "Backup and restore points are configured"
    ]
  },
  {
    title: "Design & User Experience",
    items: [
      "Responsive design tested on desktop, tablet, and mobile",
      "All fonts and images render correctly on all browsers",
      "Navigation is intuitive and consistent across pages",
      "Favicon and site logo appear correctly",
      "Buttons, CTAs, and forms are visually distinct and functional",
      "Accessibility basics (alt text, ARIA labels, color contrast) are met"
    ]
  },
  {
    title: "Technical Functionality", 
    items: [
      "All internal links work (no 404 or redirect loops)",
      "Forms send data correctly (test all contact/newsletter/checkout forms)",
      "Error pages (404, 500) are branded and helpful",
      "Sitemap.xml is generated and accessible",
      "Robots.txt is configured and allows proper crawling",
      "Canonical tags are correctly set",
      "Structured data (JSON-LD schema) is validated with Rich Results Test",
      "Redirects from old URLs are mapped (301 redirects)"
    ]
  },
  {
    title: "SEO Optimization",
    items: [
      "Meta titles and descriptions are unique and optimized",
      "H1-H3 structure is consistent per page",
      "Alt text added for all images", 
      "Keyword density is natural and well-distributed",
      "Internal linking follows a logical structure",
      "Google Analytics 4 and Google Search Console are connected",
      "Bing Webmaster Tools connected (optional)",
      "No-index tags only on staging or draft pages"
    ]
  },
  {
    title: "eCommerce",
    items: [
      "Add to Cart, Checkout, and Payment flows fully tested",
      "Shipping, taxes, and discount logic verified",
      "Transactional emails tested",
      "Inventory management linked to products", 
      "Abandoned cart recovery configured"
    ]
  },
  {
    title: "Legal & Compliance",
    items: [
      "Privacy Policy and Terms of Service pages added",
      "Cookie consent banner enabled (if targeting EU/CA)",
      "Refund, return, or cancellation policy visible",
      "Accessibility statement (if required)",
      "GDPR / CCPA compliance confirmed if collecting user data"
    ]
  },
  {
    title: "Performance & Security",
    items: [
      "Image compression and lazy loading enabled",
      "Caching and CDN configured",
      "Minified CSS/JS/HTML",
      "No mixed-content warnings (HTTPS only)",
      "Website scanned for malware or vulnerabilities",
      "Login credentials and admin access secured (2FA enabled)"
    ]
  },
  {
    title: "Launch & Monitoring",
    items: [
      "Final QA review completed",
      "Uptime monitoring configured", 
      "Analytics tracking verified live",
      "Post-launch redirect test run",
      "Submit sitemap to Google Search Console",
      "Announce launch via email or social media"
    ]
  }
];

/* ---------- Data Management ---------- */
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return seed(defaultTemplate);
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed)) return seed(defaultTemplate);
    
    // Ensure all items have proper boolean done values
    const normalized = parsed.map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        done: Boolean(item.done) // Ensure it's explicitly boolean
      }))
    }));
    
    return normalized;
  }catch(e){
    console.warn("Load failed, using defaults", e);
    return seed(defaultTemplate);
  }
}

function seed(tpl){
  const seeded = tpl.map(sec=>({
    id: generateId(),
    title: sec.title,
    items: sec.items.map(txt=>({id: generateId(), text: txt, done:false}))
  }));
  saveData(seeded);
  return seeded;
}

function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  setSavedState();
}

function generateId() {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/* ---------- State ---------- */
let state = loadData();
let filter = "";
let currentPage = "overview";

/* ---------- Page Mapping ---------- */
const pageMapping = {
  overview: null,
  strategy: "Strategy & Setup",
  design: "Design & User Experience", 
  technical: "Technical Functionality",
  seo: "SEO Optimization",
  ecommerce: "eCommerce",
  legal: "Legal & Compliance",
  performance: "Performance & Security",
  launch: "Launch & Monitoring"
};

/* ---------- Helpers ---------- */
function el(tag, attrs={}, ...children){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==="class") node.className=v;
    else if(k==="dataset") Object.assign(node.dataset,v);
    else if(k.startsWith("on") && typeof v==="function") node.addEventListener(k.substring(2), v, {passive:true});
    else if(k==="html") node.innerHTML=v;
    else node.setAttribute(k, v);
  });
  for(const c of children.flat()){
    if(c==null) continue;
    node.appendChild(typeof c==="string" ? document.createTextNode(c) : c);
  }
  return node;
}

function svgIcon(pathD, size=16){
  const s = document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("width", size); s.setAttribute("height", size); s.setAttribute("viewBox","0 0 24 24");
  const p = document.createElementNS("http://www.w3.org/2000/svg","path");
  p.setAttribute("d", pathD); p.setAttribute("fill","currentColor");
  s.appendChild(p);
  return s;
}

function setSavedState(){
  const btn = document.getElementById("saveBtn");
  btn.textContent = "Saved";
  btn.classList.remove("warn");
  clearTimeout(setSavedState._t);
  setSavedState._t = setTimeout(()=>{ btn.textContent="Saved"; }, 800);
}

function getIconForSection(title) {
  const iconMap = {
    "Strategy & Setup": "🎯",
    "Design & User Experience": "🎨", 
    "Technical Functionality": "⚙️",
    "SEO Optimization": "🔍",
    "eCommerce": "🛒",
    "Legal & Compliance": "⚖️",
    "Performance & Security": "⚡",
    "Launch & Monitoring": "🚀"
  };
  return iconMap[title] || "📋";
}

/* ---------- Navigation ---------- */
function setCurrentPage(page) {
  currentPage = page;
  updateNavTabs();
  render();
}

function updateNavTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === currentPage);
  });
}

function updateNavigation() {
  // Update progress indicators for each tab
  Object.keys(pageMapping).forEach(pageKey => {
    const progressEl = document.getElementById(`${pageKey}-progress`);
    if (!progressEl) return;
    
    if (pageKey === 'overview') {
      const total = state.reduce((acc, section) => acc + section.items.length, 0);
      const completed = state.reduce((acc, section) => acc + section.items.filter(item => item.done).length, 0);
      progressEl.textContent = `${completed}/${total}`;
    } else {
      const sectionTitle = pageMapping[pageKey];
      const section = state.find(s => s.title === sectionTitle);
      if (section) {
        const completed = section.items.filter(item => item.done).length;
        const total = section.items.length;
        progressEl.textContent = `${completed}/${total}`;
      }
    }
  });
}

/* ---------- Rendering ---------- */
const app = document.getElementById("app");
const pageTitle = document.getElementById("page-title");
const pageStats = document.getElementById("page-stats");

function render() {
  app.innerHTML = "";
  
  if (currentPage === "overview") {
    renderOverview();
  } else {
    renderSectionPage();
  }
  
  updateNavigation();
}

function renderOverview() {
  pageTitle.textContent = "Overview";
  
  const totalItems = state.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = state.reduce((acc, section) => acc + section.items.filter(item => item.done).length, 0);
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  pageStats.innerHTML = `
    <div class="stat-item">
      <span>Total Progress:</span>
      <span class="stat-value">${completedItems}/${totalItems} (${completionPercentage}%)</span>
    </div>
    <div class="overview-actions">
      <button onclick="uncheckAllItems()" class="uncheck-all-btn">Uncheck All Items</button>
      <button onclick="clearAllDataAndReset()" class="reset-all-btn">Reset All Data</button>
    </div>
  `;
  
  state.forEach((section) => {
    const sectionKey = Object.keys(pageMapping).find(key => pageMapping[key] === section.title);
    const completedCount = section.items.filter(item => item.done).length;
    const totalCount = section.items.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isCompleted = percentage === 100 && totalCount > 0;
    
    const card = el("div", {
      class: `overview-card ${isCompleted ? 'completed' : ''}`,
      onclick: () => {
        if (sectionKey) {
          setCurrentPage(sectionKey);
        }
      }
    },
      el("div", {class: "card-icon"}, getIconForSection(section.title)),
      el("div", {class: "card-content"},
        el("h3", {class: "card-title"}, section.title),
        el("p", {class: "card-progress"}, `${completedCount} of ${totalCount} completed`),
        el("div", {class: "progress-bar"},
          el("div", {
            class: `progress-fill ${isCompleted ? 'completed' : ''}`,
            style: `width: ${percentage}%`
          })
        )
      )
    );
    
    app.appendChild(card);
  });
}

function renderSectionPage() {
  const sectionTitle = pageMapping[currentPage];
  const section = state.find(s => s.title === sectionTitle);
  
  if (!section) {
    app.innerHTML = '<div class="empty">Section not found</div>';
    return;
  }
  
  pageTitle.textContent = section.title;
  
  const completedCount = section.items.filter(item => item.done).length;
  const totalCount = section.items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  pageStats.innerHTML = `
    <div class="stat-item">
      <span>Progress:</span>
      <span class="stat-value">${completedCount}/${totalCount} (${percentage}%)</span>
    </div>
  `;
  
  const q = filter.trim().toLowerCase();
  const matchSection = section.title.toLowerCase().includes(q);
  const visibleItems = section.items.filter(it => matchSection || it.text.toLowerCase().includes(q));
  const sIdx = state.findIndex(s => s.title === sectionTitle);

  const sectionEl = el("section", {class:"section", "data-id":section.id});
  const header = el("div",{class:"section-title"},
    el("h2",{contenteditable:"true", class:"text", spellcheck:"false",
             onblur:(e)=>{ 
               section.title = e.target.textContent.trim() || "Untitled"; 
               saveData(state); 
             },
             ondblclick:()=>{}}, section.title),
    el("div",{},
      el("span",{class:"pill"}, `${completedCount}/${section.items.length} done `),
      el("button",{class:"icon-btn", title:"Remove section",
        onclick:()=>{
          if(confirm("Delete this section and all its items?")){
            state.splice(sIdx,1);
            saveData(state); 
            setCurrentPage("overview");
          }
        }}, svgIcon("M6 7h12l-1 13H7L6 7Zm3-3h6l1 3H8l1-3Z"))
    )
  );

  sectionEl.appendChild(header);

  const itemsList = el("ul",{class:"items"});
  if(visibleItems.length===0){
    itemsList.appendChild(el("li",{class:"empty"}, q ? "No results in this section" : "No items yet"));
  }else{
    visibleItems.forEach((item)=>{
      const listItem = el("li",{class:"item","data-id":item.id});
      const checkbox = el("input",{
        type:"checkbox",
        checked: item.done === true ? "checked" : null,
        onchange:(e)=>{ 
          item.done = e.target.checked; 
          saveData(state); 
          render(); 
        }
      });
      const textEl = el("div",{class:"text",contenteditable:"true",spellcheck:"false",
        onblur:(e)=>{ 
          item.text = e.target.textContent.trim() || "New item"; 
          saveData(state); 
        },
        ondblclick:()=>{}}, item.text);
      const actions = el("div",{class:"row-actions"},
        el("button",{class:"icon-btn",title:"Duplicate",
          onclick:()=>{
            const clone = { id: generateId(), text:item.text, done:false };
            const idx = section.items.findIndex(x=>x.id===item.id);
            section.items.splice(idx+1,0,clone);
            saveData(state); 
            render();
          }}, svgIcon("M4 7h9v11H4V7Zm7-3h9v11h-2V6h-7V4Z")),
        el("button",{class:"icon-btn",title:"Delete",
          onclick:()=>{
            section.items = section.items.filter(x=>x.id!==item.id);
            saveData(state); 
            render();
          }}, svgIcon("M6 7h12v2H6V7Zm1 3h10l-1 8H8l-1-8Zm3-5h4l1 2H9l1-2Z"))
      );
      listItem.append(checkbox, textEl, actions);
      itemsList.appendChild(listItem);
    });
  }
  sectionEl.appendChild(itemsList);

  const adder = el("div",{class:"adder"},
    el("input",{type:"text",placeholder:"Add a new item…", "aria-label":"New item",
      onkeydown:(e)=>{
        if(e.key==="Enter"){
          const val = e.target.value.trim();
          if(!val) return;
          section.items.push({id:generateId(), text:val, done:false});
          e.target.value=""; 
          saveData(state); 
          render();
        }
      }}),
    el("button",{class:"primary",onclick:(e)=>{
      const input = e.target.parentElement.querySelector("input");
      const val = input.value.trim();
      if(!val) return;
      section.items.push({id:generateId(), text:val, done:false});
      input.value=""; 
      saveData(state); 
      render();
    }}, "Add")
  );
  sectionEl.appendChild(adder);

  app.appendChild(sectionEl);
}

/* ---------- Utility Functions ---------- */
function uncheckAllItems() {
  if(confirm("Uncheck all items? This will mark all tasks as incomplete so you can check them off as you complete them.")){
    state.forEach(section => {
      section.items.forEach(item => {
        item.done = false;
      });
    });
    saveData(state);
    render();
  }
}

function clearAllDataAndReset() {
  if(confirm("Clear all data and reset to default unchecked state? This will remove all your current data and start fresh.")){
    localStorage.removeItem(STORAGE_KEY);
    state = seed(defaultTemplate);
    render();
  }
}

/* ---------- Event Handlers ---------- */
document.getElementById("addSectionBtn").addEventListener("click", ()=>{
  const name = prompt("Section name");
  if(!name) return;
  state.push({id:generateId(), title:name.trim(), items:[]});
  saveData(state); 
  render();
});

document.getElementById("resetBtn").addEventListener("click", ()=>{
  if(confirm("Reset to the default template? This will replace your current checklist and clear all progress.")){
    // Clear localStorage first to ensure clean reset
    localStorage.removeItem(STORAGE_KEY);
    state = seed(defaultTemplate); 
    render();
  }
});

document.getElementById("printBtn").addEventListener("click", ()=>window.print());

document.getElementById("exportBtn").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "website-prelaunch-checklist.json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("importFile").addEventListener("change", (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () =>{
    try{
      const data = JSON.parse(reader.result);
      state = (data || []).map(sec=>({
        id: sec.id || generateId(),
        title: String(sec.title || "Untitled"),
        items: Array.isArray(sec.items) ? sec.items.map(it=>({
          id: it.id || generateId(),
          text: String(it.text || ""),
          done: Boolean(it.done === true) // Ensure explicit boolean false for unchecked
        })) : []
      }));
      saveData(state); 
      render();
    }catch(err){
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("saveBtn").addEventListener("click", ()=>{ 
  saveData(state); 
});

document.addEventListener("keydown", (e)=>{
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==="s"){
    e.preventDefault(); 
    saveData(state);
  }
});

document.getElementById("search").addEventListener("input", (e)=>{
  filter = e.target.value; 
  render();
});

// Navigation event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setCurrentPage(tab.dataset.page);
    });
  });
  
  render();
});