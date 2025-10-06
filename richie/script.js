(function(){
  const STORAGE_KEY = 'lt_files_v1';
  const fileInput = document.getElementById('fileInput');
  const uploadLabel = document.getElementById('uploadLabel');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const fileGrid = document.getElementById('fileGrid');
  const searchBar = document.getElementById('searchBar');
  const categoryFilter = document.getElementById('categoryFilter');

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

  function readSaved(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch(e){ return []; } }
  function writeSaved(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

  function renderAll() {
    const files = readSaved();
    displayFiles(files);
  }

  function displayFiles(files) {
    fileGrid.innerHTML = '';
    if (!files.length) return fileGrid.innerHTML = '<div class="empty">No files found.</div>';
    files.forEach(f => addCardToDOM(f));
  }

  function addCardToDOM(f){
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = f.id;
    card.dataset.type = categorizeFile(f.type, f.name);

    let thumbHTML = '';
    if (f.type.startsWith('image/')) thumbHTML = `<div class="thumb"><img src="${f.data}" alt="${escapeHtml(f.name)}"></div>`;
    else {
      const ext = escapeHtml((f.name.split('.').pop()||'').toUpperCase());
      thumbHTML = `<div class="thumb">${ext || 'FILE'}</div>`;
    }

    card.innerHTML = `
      ${thumbHTML}
      <div class="fname">${escapeHtml(f.name)}</div>
      <div class="actions">
        <button class="btn view">View</button>
        <a class="btn" role="button" download>Download</a>
        <button class="btn rename">Rename</button>
        <button class="btn" style="background:#ef4444;color:white" title="Delete">Delete</button>
      </div>
    `;

    card.querySelector('.view').addEventListener('click',()=>viewFile(f.id));
    const dlA = card.querySelector('a[role="button"]');
    dlA.href = f.data; dlA.download = f.name;

    card.querySelector('.rename').addEventListener('click',()=>{
      const newName = prompt('Rename file to:', f.name);
      if (newName && newName.trim()) {
        updateName(f.id, newName.trim());
        card.querySelector('.fname').textContent = newName.trim();
        dlA.download = newName.trim();
      }
    });

    card.querySelector('button[title="Delete"]').addEventListener('click',()=>{
      if(confirm('Delete this file?')){
        removeFile(f.id);
        card.remove();
        if(!fileGrid.children.length) renderAll();
      }
    });

    fileGrid.prepend(card);
  }

  function categorizeFile(type, name){
    if(type.startsWith('image/')) return 'image';
    if(type.startsWith('video/')) return 'video';
    const ext = name.split('.').pop().toLowerCase();
    if(['pdf','doc','docx','txt','ppt','xls'].includes(ext)) return 'document';
    return 'other';
  }

  function viewFile(id){
    const f = readSaved().find(x=>x.id===id);
    if(!f) return alert('File not found');
    const w = window.open();
    w.document.write(`<title>${escapeHtml(f.name)}</title><iframe src="${f.data}" style="width:100%;height:100vh;border:none"></iframe>`);
  }

  function removeFile(id){
    let arr = readSaved().filter(x=>x.id!==id);
    writeSaved(arr);
  }

  function updateName(id,newName){
    let arr = readSaved().map(x=>x.id===id?{...x,name:newName}:x);
    writeSaved(arr);
  }

  uploadLabel.addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',e=>{
    const files = Array.from(e.target.files||[]);
    files.forEach(file=>{
      const reader=new FileReader();
      reader.onload=(ev)=>{
        const fObj={id:uid(),name:file.name,type:file.type||'',data:ev.target.result};
        const arr=readSaved();arr.push(fObj);writeSaved(arr);
        addCardToDOM(fObj);
      };
      reader.readAsDataURL(file);
    });
    e.target.value='';
  });

  clearAllBtn.addEventListener('click',()=>{
    if(confirm('Clear all files?')){
      localStorage.removeItem(STORAGE_KEY);
      renderAll();
    }
  });

  // 🔍 Search & Filter Logic
  function filterFiles(){
    const query = searchBar.value.toLowerCase();
    const category = categoryFilter.value;
    let files = readSaved();

    if(query) files = files.filter(f=>f.name.toLowerCase().includes(query));
    if(category!=='all') files = files.filter(f=>categorizeFile(f.type,f.name)===category);

    displayFiles(files);
  }

  searchBar.addEventListener('input',filterFiles);
  categoryFilter.addEventListener('change',filterFiles);

  renderAll();

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
})();