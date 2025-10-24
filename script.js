/* ---------- Data & API Functions ---------- */
const API_BASE = '';

// API helper function
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Load data from database
async function loadData() {
  try {
    return await apiCall('/sections');
  } catch (error) {
    console.error('Failed to load data:', error);
    return [];
  }
}

// Save individual operations (no longer needed as everything is real-time)
async function saveData(data) {
  // This function is kept for compatibility but operations are now real-time
  setSavedState();
}

// Generate ID (client-side fallback)
function generateId() {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for older browsers
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/* ---------- State ---------- */
let state = [];
let filter = "";

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

function markDirty(){
  const btn = document.getElementById("saveBtn");
  btn.textContent = "Saving…";
}

/* ---------- Rendering ---------- */
const app = document.getElementById("app");

function render(){
  app.innerHTML = "";
  const q = filter.trim().toLowerCase();

  state.forEach((section, sIdx)=>{
    const matchSection = section.title.toLowerCase().includes(q);
    const visibleItems = section.items.filter(it => matchSection || it.text.toLowerCase().includes(q));

    const countDone = section.items.filter(i=>i.done).length;

    const sec = el("section", {class:"section", "data-id":section.id});
    const head = el("div",{class:"section-title"},
      el("h2",{contenteditable:"true", class:"text", spellcheck:"false",
               onblur:async (e)=>{ 
                 const newTitle = e.target.textContent.trim() || "Untitled";
                 if (newTitle !== section.title) {
                   try {
                     await apiCall(`/sections/${section.id}`, {
                       method: 'PUT',
                       body: JSON.stringify({ title: newTitle })
                     });
                     section.title = newTitle;
                   } catch (error) {
                     console.error('Failed to update section title:', error);
                     e.target.textContent = section.title; // Revert on error
                   }
                 }
               },
               ondblclick:()=>{}}, section.title),
      el("div",{},
        el("span",{class:"pill"}, `${countDone}/${section.items.length} done `),
        el("button",{class:"icon-btn", title:"Remove section",
          onclick:async ()=>{
            if(confirm("Delete this section and all its items?")){
              try {
                await apiCall(`/sections/${section.id}`, {
                  method: 'DELETE'
                });
                state.splice(sIdx,1);
                render();
              } catch (error) {
                console.error('Failed to delete section:', error);
              }
            }
          }}, svgIcon("M6 7h12l-1 13H7L6 7Zm3-3h6l1 3H8l1-3Z"))
      )
    );

    sec.appendChild(head);

    const list = el("ul",{class:"items"});
    if(visibleItems.length===0){
      list.appendChild(el("li",{class:"empty"}, q ? "No results in this section" : "No items yet"));
    }else{
      visibleItems.forEach((item)=>{
        const li = el("li",{class:"item","data-id":item.id});
        const cb = el("input",{type:"checkbox",checked:item.done === true ? "checked":null,
          onchange:async (e)=>{ 
            try {
              await apiCall(`/items/${item.id}`, {
                method: 'PUT',
                body: JSON.stringify({ done: e.target.checked })
              });
              item.done = e.target.checked; 
              render(); 
            } catch (error) {
              console.error('Failed to update item:', error);
              e.target.checked = !e.target.checked; // Revert on error
            }
          }});
        const txt = el("div",{class:"text",contenteditable:"true",spellcheck:"false",
          onblur:async (e)=>{ 
            const newText = e.target.textContent.trim() || "New item";
            if (newText !== item.text) {
              try {
                await apiCall(`/items/${item.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ text: newText })
                });
                item.text = newText;
              } catch (error) {
                console.error('Failed to update item text:', error);
                e.target.textContent = item.text; // Revert on error
              }
            }
          },
          ondblclick:()=>{}}, item.text);
        const actions = el("div",{class:"row-actions"},
          el("button",{class:"icon-btn",title:"Duplicate",
            onclick:async ()=>{
              try {
                const newItem = await apiCall(`/items/${item.id}/duplicate`, {
                  method: 'POST'
                });
                const idx = section.items.findIndex(x=>x.id===item.id);
                section.items.splice(idx+1,0,newItem);
                render();
              } catch (error) {
                console.error('Failed to duplicate item:', error);
              }
            }}, svgIcon("M4 7h9v11H4V7Zm7-3h9v11h-2V6h-7V4Z")),
          el("button",{class:"icon-btn",title:"Delete",
            onclick:async ()=>{
              try {
                await apiCall(`/items/${item.id}`, {
                  method: 'DELETE'
                });
                section.items = section.items.filter(x=>x.id!==item.id);
                render();
              } catch (error) {
                console.error('Failed to delete item:', error);
              }
            }}, svgIcon("M6 7h12v2H6V7Zm1 3h10l-1 8H8l-1-8Zm3-5h4l1 2H9l1-2Z"))
        );
        li.append(cb, txt, actions);
        list.appendChild(li);
      });
    }
    sec.appendChild(list);

    const adder = el("div",{class:"adder"},
      el("input",{type:"text",placeholder:"Add a new item…", "aria-label":"New item",
        onkeydown:async (e)=>{
          if(e.key==="Enter"){
            const val = e.target.value.trim();
            if(!val) return;
            try {
              const newItem = await apiCall(`/sections/${section.id}/items`, {
                method: 'POST',
                body: JSON.stringify({ text: val })
              });
              section.items.push(newItem);
              e.target.value=""; 
              render();
            } catch (error) {
              console.error('Failed to add item:', error);
            }
          }
        }}),
      el("button",{class:"primary",onclick:async (e)=>{
        const input = e.target.parentElement.querySelector("input");
        const val = input.value.trim();
        if(!val) return;
        try {
          const newItem = await apiCall(`/sections/${section.id}/items`, {
            method: 'POST',
            body: JSON.stringify({ text: val })
          });
          section.items.push(newItem);
          input.value=""; 
          render();
        } catch (error) {
          console.error('Failed to add item:', error);
        }
      }}, "Add")
    );
    sec.appendChild(adder);

    if(q && !matchSection && visibleItems.length===0){
      // hide entire section when no match anywhere
      return;
    }
    app.appendChild(sec);
  });
}

/* ---------- Utility Functions ---------- */
async function uncheckAllItems() {
  if(confirm("Uncheck all items? This will mark all tasks as incomplete so you can check them off as you complete them.")){
    try {
      await apiCall('/api/uncheck-all', { method: 'POST' });
      state = await loadData();
      render();
    } catch (error) {
      console.error('Failed to uncheck all items:', error);
      alert('Failed to uncheck all items. Please try again.');
    }
  }
}

/* ---------- Actions ---------- */
document.getElementById("addSectionBtn").addEventListener("click", async ()=>{
  const name = prompt("Section name");
  if(!name) return;
  try {
    const newSection = await apiCall('/sections', {
      method: 'POST',
      body: JSON.stringify({ title: name.trim() })
    });
    state.push(newSection);
    render();
  } catch (error) {
    console.error('Failed to add section:', error);
  }
});

document.getElementById("resetBtn").addEventListener("click", async ()=>{
  if(confirm("Reset to the default template? This will replace your current checklist.")){
    try {
      await apiCall('/init', { method: 'POST' });
      state = await loadData();
      render();
    } catch (error) {
      console.error('Failed to reset to template:', error);
    }
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

document.getElementById("importFile").addEventListener("change", async (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async () =>{
    try{
      const data = JSON.parse(reader.result);
      // Normalize data
      const normalizedData = (data || []).map(sec=>({
        id: sec.id || generateId(),
        title: String(sec.title || "Untitled"),
        items: Array.isArray(sec.items) ? sec.items.map(it=>({
          id: it.id || generateId(),
          text: String(it.text || ""),
          done: !!it.done
        })) : []
      }));
      
      await apiCall('/import', {
        method: 'POST',
        body: JSON.stringify({ data: normalizedData })
      });
      
      state = await loadData();
      render();
    }catch(err){
      console.error('Import failed:', err);
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("saveBtn").addEventListener("click", async ()=>{ 
  // Data is automatically saved with each operation
  setSavedState();
});

document.addEventListener("keydown", async (e)=>{
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==="s"){
    e.preventDefault(); 
    setSavedState(); // Data is automatically saved
  }
});

document.getElementById("search").addEventListener("input", (e)=>{
  filter = e.target.value; 
  render();
});

/* ---------- Init ---------- */
async function init() {
  state = await loadData();
  render();
}

init();