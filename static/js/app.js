const $ = id => document.getElementById(id);
const COVER = document.body.dataset.cover, API = document.body.dataset.api;
const SEP = "\u0001", CAP = 5000, HINT = '<span class="muted">Nhấn Draw Neighbours hoặc Show Image</span>';
const coll = new Intl.Collator("vi");
let rows = [], adj = new Map(), pred = new Map();

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const msg = t => { $("out").textContent = t; };
const P = (u, v) => pred.get(u + SEP + v) ?? "";

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const out = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f); f = ""; out.push(row); row = [];
    } else f += c;
  }
  if (f !== "" || row.length) { row.push(f); out.push(row); }
  return out.filter(r => r.some(x => x !== ""));
}

function fillList(id, items) {
  $(id).innerHTML = items.map(v => `<option value="${esc(v)}">`).join("");
}

function loadKG(text, name) {
  const t = parseCSV(text);
  const h = (t[0] || []).map(x => x.trim());
  const ih = h.indexOf("Head"), ip = h.indexOf("Predicate"), it = h.indexOf("Tail");
  if (ih < 0 || ip < 0 || it < 0) { msg("Tệp KG phải có ba cột: Head, Predicate, Tail."); return false; }
  return setRows(t.slice(1).map(r => ({ Head: r[ih] ?? "", Predicate: r[ip] ?? "", Tail: r[it] ?? "" })), name);
}

function setRows(list, name) {
  rows = list;
  adj = new Map(); pred = new Map();
  for (const r of rows) {
    if (!adj.has(r.Head)) adj.set(r.Head, new Set());
    if (!adj.has(r.Tail)) adj.set(r.Tail, new Set());
    adj.get(r.Head).add(r.Tail); adj.get(r.Tail).add(r.Head);
    pred.set(r.Head + SEP + r.Tail, r.Predicate); pred.set(r.Tail + SEP + r.Head, r.Predicate);
  }
  const heads = [...new Set(rows.map(r => r.Head))].sort(coll.compare);
  const tails = [...new Set(rows.map(r => r.Tail))].sort(coll.compare);
  fillList("dlH", ["All", ...heads]); fillList("dlT", ["All", ...tails]);
  fillList("dlS", [...adj.keys()].sort(coll.compare));
  $("head").value = "All"; $("tail").value = "All";
  $("fname").textContent = "Tệp KG hiện tại: " + name;
  renderTable(rows);
  return true;
}

function renderTable(list) {
  $("tb").innerHTML = list.map(r =>
    `<tr><td data-v="${esc(r.Head)}">${esc(r.Head)}</td><td data-v="${esc(r.Head)}">${esc(r.Predicate)}</td><td data-v="${esc(r.Tail)}">${esc(r.Tail)}</td></tr>`
  ).join("");
  $("cnt").textContent = `Hiển thị ${list.length.toLocaleString("vi-VN")} / ${rows.length.toLocaleString("vi-VN")} dòng`;
}

function filterData() {
  const h = $("head").value.trim(), t = $("tail").value.trim();
  const all = v => !v || v.toLowerCase() === "all";
  renderTable(rows.filter(r => (all(h) || r.Head === h) && (all(t) || r.Tail === t)));
}

function drawNeighbours() {
  const s = $("source").value.trim();
  if (!s) return msg("Vui lòng chọn hoặc nhập giá trị Source!");
  if (!adj.has(s)) return msg(`Node “${s}” không tồn tại trong đồ thị!`);
  const nb = [...adj.get(s)];
  msg(`--- Các hàng xóm trực tiếp của “${s}” (${nb.length}) ---\n` + nb.map(n => `- ${s} --[${P(s, n)}]--> ${n}`).join("\n"));

  const pos = new Map([[s, [0, 0]]]);
  let idx = 0, cap = 14, ring = 0, maxR = 150;
  while (idx < nb.length) {
    const c = Math.min(cap, nb.length - idx), r = 150 + ring * 120;
    for (let j = 0; j < c; j++) {
      const a = 2 * Math.PI * j / c - Math.PI / 2 + ring * 0.3;
      pos.set(nb[idx + j], [r * Math.cos(a), r * Math.sin(a)]);
    }
    idx += c; cap += 14; ring++; maxR = r;
  }
  const R = (nb.length ? maxR : 60) + 130, nodes = [s, ...nb], inSub = new Set(nodes), showLbl = nb.length <= 40;
  let edges = "", lbls = "", circles = "";
  for (const u of nodes) for (const v of adj.get(u)) {
    if (!inSub.has(v) || !(u < v)) continue;
    const [x1, y1] = pos.get(u), [x2, y2] = pos.get(v);
    edges += `<line class="e" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    if (showLbl && P(u, v)) {
      let a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; if (a > 90 || a < -90) a += 180;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      lbls += `<text x="${mx}" y="${my}" font-size="9" text-anchor="middle" dominant-baseline="central" transform="rotate(${a} ${mx} ${my})">${esc(P(u, v))}</text>`;
    }
  }
  for (const n of nodes) {
    const [x, y] = pos.get(n), src = n === s;
    circles += `<g class="n" data-n="${esc(n)}"><title>${esc(n)}</title><circle cx="${x}" cy="${y}" r="20" fill="${src ? "#2f80d1" : "#a9d3fa"}"/>` +
      `<text x="${x}" y="${y}" font-size="11" text-anchor="middle" dominant-baseline="central">${esc(n)}</text></g>`;
  }
  const size = 2 * R;
  $("stage").innerHTML = `<svg width="${size}" height="${size}" viewBox="${-R} ${-R} ${size} ${size}">${edges}${lbls}${circles}</svg>`;
  const st = $("stage");
  st.scrollLeft = (size - st.clientWidth) / 2; st.scrollTop = (size - st.clientHeight) / 2;
}

function findK() {
  const ks = $("k").value.trim();
  if (!/^\d+$/.test(ks) || +ks < 1) return msg("Giá trị k phải là một số nguyên dương hợp lệ!");
  const k = +ks;
  if (!adj.size) return msg("Đồ thị trống!");
  const s = $("source").value.trim(), only = $("only").checked && s !== "";
  if (only && !adj.has(s)) return msg(`Node “${s}” không tồn tại trong đồ thị!`);
  const res = []; let stop = "", steps = 0; const t0 = Date.now();
  const path = [], used = new Set();
  const dfs = n => {
    if (stop) return;
    path.push(n); used.add(n);
    if (path.length === k + 1) {
      if (only || path[0] < path[k]) { res.push(path.slice()); if (res.length >= CAP) stop = "cap"; }
    } else {
      if ((++steps & 4095) === 0 && Date.now() - t0 > 4000) stop = "time";
      for (const m of adj.get(n)) { if (!used.has(m)) dfs(m); if (stop) break; }
    }
    path.pop(); used.delete(n);
  };
  for (const n of (only ? [s] : adj.keys())) { dfs(n); if (stop) break; }
  const lines = res.map(p => ({ key: p.join(SEP), p })).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
    .map((o, i) => `${i + 1}. ` + o.p[0] + o.p.slice(1).map((v, j) => ` --[${P(o.p[j], v)}]--> ${v}`).join(""));
  let head = `Danh sách các con đường có độ dài k = ${k} (kèm Predicate)${only ? ` bắt đầu từ “${s}”` : " trên toàn đồ thị"}:\n` + "=".repeat(65) + "\n";
  if (!lines.length) head += `Không tìm thấy con đường nào có độ dài k = ${k}!\n`;
  if (stop) head += `⚠ Đã dừng sớm (${stop === "cap" ? "đạt giới hạn " + CAP.toLocaleString("vi-VN") + " đường" : "quá 4 giây"}); danh sách dưới đây chưa đầy đủ. Hãy nhập Source để thu hẹp.\n`;
  msg(head + lines.join("\n"));
}

function clearAll() {
  $("stage").innerHTML = HINT; msg("");
  $("source").value = ""; $("k").value = "2";
  document.querySelectorAll("tr.sel").forEach(r => r.classList.remove("sel"));
}

$("bDraw").onclick = drawNeighbours;
$("bK").onclick = findK;
$("bClear").onclick = clearAll;
$("bFilter").onclick = filterData;
$("bImg").onclick = () => { $("stage").innerHTML = `<img src="${COVER}" alt="Bìa sách Những cây thuốc và vị thuốc Việt Nam">`; };
$("bOpen").onclick = () => $("file").click();
$("file").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => { if (loadKG(fr.result, f.name)) { clearAll(); } };
  fr.onerror = () => msg("Không đọc được tệp: " + f.name);
  fr.readAsText(f, "utf-8"); e.target.value = "";
};
$("tb").onclick = e => {
  const td = e.target.closest("td"); if (!td) return;
  document.querySelectorAll("tr.sel").forEach(r => r.classList.remove("sel"));
  td.parentNode.classList.add("sel");
  $("source").value = td.dataset.v;
};
$("stage").onclick = e => {
  const g = e.target.closest("[data-n]"); if (!g) return;
  $("source").value = g.dataset.n; drawNeighbours();
};

$("stage").innerHTML = HINT;
fetch(API, { cache: "no-store" })
  .then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
  .then(d => setRows(d.edges.map(e => ({ Head: e[0], Predicate: e[1], Tail: e[2] })), d.file))
  .catch(e => msg("Không tải được dữ liệu từ máy chủ (" + e.message + "). Bạn có thể bấm “Mở tệp KG (.csv)” để chọn tệp từ máy."));
