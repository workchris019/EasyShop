// admin-support.html: read and answer customer messages, and announce things on the website.
Admin.ready.then(async ({ view }) => {
  const { esc, icon, api, json, toast, date, $, $$ } = Admin;
  let convs = [];
  let current = null; // cid of the open chat
  let tab = new URLSearchParams(location.search).get('tab') === 'announce' ? 'announce' : 'chats';
  let announcements = [];

  view.innerHTML = '<div class="page-head"><div><h1>Support</h1><p>Customers write to you from the Support page on your website. Your answers show there.</p></div></div>' +
    '<div class="tabs"><button type="button" data-tab="chats">Messages</button><button type="button" data-tab="announce">Announcements</button></div><div id="pane"></div>';

  const who = (c) => c.name || 'Customer';

  /* ---------- Messages ---------- */
  function drawChatsShell() {
    $('#pane').innerHTML = '<div class="support-grid"><div class="card conv-list" id="convList"></div><div class="card conv-thread" id="thread"><p class="empty">Choose a chat on the left.</p></div></div>';
    drawList();
    if (current) openChat(current, true);
  }

  function drawList() {
    const box = $('#convList');
    if (!box) return;
    box.innerHTML = convs.length ? convs.map((c) =>
      '<button type="button" class="conv' + (c.cid === current ? ' on' : '') + '" data-cid="' + esc(c.cid) + '"><span class="cv-top"><b>' + esc(who(c)) + '</b>' + (c.unread ? '<span class="nb">' + c.unread + '</span>' : '') + '</span>' +
      '<small class="muted">' + (c.phone ? '+' + esc(c.phone) + ' · ' : '') + esc(date(c.lastAt)) + '</small>' +
      (c.last ? '<small>' + (c.last.from === 'admin' ? 'You: ' : '') + esc(c.last.text) + '</small>' : '') + '</button>').join('')
      : '<p class="empty">No messages yet. They will appear here when a customer writes to you.</p>';
  }

  async function loadList() {
    try { convs = await api('/api/admin/support'); drawList(); } catch (e) { /* keep what we have */ }
  }

  function bubbles(msgs) {
    return msgs.map((m) => '<div class="bub ' + (m.from === 'admin' ? 'admin' : 'cust') + '"><p>' + esc(m.text) + '</p><small>' + esc(date(m.at)) + '</small></div>').join('');
  }

  async function openChat(cid, keepDraft) {
    current = cid;
    let d;
    try { d = await api('/api/admin/support/' + encodeURIComponent(cid)); } catch (e) { toast(e.message, true); return; }
    const box = $('#thread');
    if (!box) return;
    const draft = keepDraft && $('#rText') ? $('#rText').value : '';
    const log = $('#tLog');
    if (keepDraft && log) {
      // Only refresh the messages so what you are typing is not lost.
      const stick = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
      log.innerHTML = bubbles(d.messages);
      if (stick) log.scrollTop = log.scrollHeight;
    } else {
      box.innerHTML = '<div class="th-head"><div><b>' + esc(who(d)) + '</b>' + (d.phone ? '<small class="muted">+' + esc(d.phone) + '</small>' : '') + '</div>' +
        '<div class="actions"><button type="button" class="btn sm ghost" data-announce="' + esc(d.cid) + '">' + icon('bell') + 'Announce to this customer</button>' +
        '<button type="button" class="btn sm outline-danger" data-delchat="' + esc(d.cid) + '">Delete chat</button></div></div>' +
        '<div class="th-log" id="tLog">' + bubbles(d.messages) + '</div>' +
        '<form class="th-form" id="rForm" novalidate><textarea id="rText" rows="2" maxlength="1000" placeholder="Write your reply..." aria-label="Reply">' + esc(draft) + '</textarea><button type="submit" class="btn" id="rBtn">Send reply</button></form>';
      $('#tLog').scrollTop = $('#tLog').scrollHeight;
      $('#rForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = $('#rText').value.trim();
        if (!text) return;
        $('#rBtn').disabled = true;
        try {
          await api('/api/admin/support/' + encodeURIComponent(cid) + '/reply', json('POST', { text }));
          $('#rText').value = '';
          await openChat(cid, true);
          loadList();
        } catch (ex) { toast(ex.message, true); }
        $('#rBtn').disabled = false;
      });
    }
    const c = convs.find((x) => x.cid === cid);
    if (c && c.unread) { c.unread = 0; drawList(); }
  }

  /* ---------- Announcements ---------- */
  async function drawAnnounce(preCid) {
    try { announcements = await api('/api/admin/announcements'); } catch (e) { toast(e.message, true); }
    $('#pane').innerHTML = '<div class="card"><h2 class="sub-h">New announcement</h2><p class="hint">It appears as a bar at the top of the website pages until you hide or delete it.</p><br>' +
      '<form id="aForm" novalidate><div id="aErr" class="error" role="alert" hidden></div>' +
      '<div class="field"><label for="aText">Message *</label><textarea id="aText" rows="3" maxlength="300" placeholder="e.g. Free delivery in Kigali this weekend!"></textarea></div>' +
      '<div class="row2"><div class="field"><label for="aTo">Send to</label><select id="aTo"><option value="all">Everyone on the website</option><option value="customer"' + (preCid ? ' selected' : '') + '>One customer</option></select></div>' +
      '<div class="field" id="aWho" ' + (preCid ? '' : 'hidden') + '><label for="aCid">Customer</label><select id="aCid"><option value="">Choose a customer who wrote to you...</option>' +
      convs.map((c) => '<option value="' + esc(c.cid) + '"' + (c.cid === preCid ? ' selected' : '') + '>' + esc(who(c)) + (c.phone ? ' (+' + esc(c.phone) + ')' : '') + '</option>').join('') + '</select></div></div>' +
      '<div class="field" id="aPhoneWrap" ' + (preCid ? '' : 'hidden') + '><label for="aPhone">Or a customer\'s phone number</label><input id="aPhone" type="tel" placeholder="07xx xxx xxx"><span class="hint">The customer sees it when they have an account saved on their device with this number.</span></div>' +
      '<button type="submit" class="btn" id="aBtn">' + icon('bell') + 'Publish announcement</button></form></div>' +
      '<div class="card"><h2 class="sub-h">Your announcements</h2>' + (announcements.length ? '<div class="alist">' + announcements.map((a) =>
        '<div class="ann' + (a.active ? '' : ' off') + '"><div><b>' + esc(a.target.type === 'all' ? 'Everyone' : 'To ' + (a.target.name || (a.target.phone ? '+' + a.target.phone : 'a customer'))) + '</b>' +
        ' ' + (a.active ? '<span class="pill p-delivered">Showing</span>' : '<span class="pill p-cancelled">Hidden</span>') + '<p>' + esc(a.text) + '</p><small class="muted">' + esc(date(a.createdAt)) + '</small></div>' +
        '<div class="actions"><button type="button" class="btn sm ghost" data-toggle="' + esc(a._id) + '" data-active="' + (a.active ? '1' : '0') + '">' + (a.active ? 'Hide' : 'Show') + '</button>' +
        '<button type="button" class="btn sm outline-danger" data-delann="' + esc(a._id) + '">Delete</button></div></div>').join('') + '</div>' : '<p class="empty">No announcements yet.</p>') + '</div>';

    $('#aTo').addEventListener('change', () => { const one = $('#aTo').value === 'customer'; $('#aWho').hidden = !one; $('#aPhoneWrap').hidden = !one; });
    $('#aForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#aErr');
      err.hidden = true;
      const body = { text: $('#aText').value, to: $('#aTo').value };
      if (body.to === 'customer') { body.cid = $('#aCid').value; body.phone = $('#aPhone').value; }
      $('#aBtn').disabled = true;
      try {
        await api('/api/admin/announcements', json('POST', body));
        toast('Announcement published');
        drawAnnounce();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; $('#aBtn').disabled = false; }
    });
  }

  function showTab(name, preCid) {
    tab = name;
    $$('[data-tab]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.tab === name)));
    if (name === 'chats') drawChatsShell(); else drawAnnounce(preCid);
  }

  /* ---------- Clicks ---------- */
  view.addEventListener('click', async (e) => {
    const tb = e.target.closest('[data-tab]');
    if (tb) { showTab(tb.dataset.tab); return; }
    const cv = e.target.closest('[data-cid]');
    if (cv) { await openChat(cv.dataset.cid, false); drawList(); return; }
    const an = e.target.closest('[data-announce]');
    if (an) { showTab('announce', an.dataset.announce); return; }
    const dc = e.target.closest('[data-delchat]');
    if (dc) {
      if (!confirm('Delete this whole chat? This cannot be undone.')) return;
      try { await api('/api/admin/support/' + encodeURIComponent(dc.dataset.delchat), { method: 'DELETE' }); toast('Chat deleted'); current = null; await loadList(); drawChatsShell(); } catch (ex) { toast(ex.message, true); }
      return;
    }
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      try { await api('/api/admin/announcements/' + tg.dataset.toggle, json('PATCH', { active: tg.dataset.active !== '1' })); drawAnnounce(); } catch (ex) { toast(ex.message, true); }
      return;
    }
    const da = e.target.closest('[data-delann]');
    if (da && confirm('Delete this announcement?')) {
      try { await api('/api/admin/announcements/' + da.dataset.delann, { method: 'DELETE' }); toast('Announcement deleted'); drawAnnounce(); } catch (ex) { toast(ex.message, true); }
    }
  });

  await loadList();
  showTab(tab);
  // New customer messages show up on their own.
  setInterval(async () => {
    if (document.hidden || tab !== 'chats') return;
    await loadList();
    if (current) openChat(current, true);
  }, 8000);
});
