(() => {
'use strict';

const CFG = window.CFG || {};
const API = (CFG.supabaseUrl || '').replace(/\/$/, '');

const $ = id => document.getElementById(id);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));

let auth = null;
let me = null;
let people = [];
let tasks = [];
let activeTask = null;
let conversations = [];
let activeConversation = null;
let poll = null;

const CHAT_API = CFG.chatApiBaseUrl || 'chat-api/api.php';

// ==========================================
// CHAT API
// ==========================================

async function chatApi(action, payload = {}) {

    const t = await token();

    const r = await fetch(CHAT_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + t
        },
        body: JSON.stringify({
            action,
            ...payload
        })
    });

    const j = await r.json().catch(() => ({}));

    if (!r.ok || j.error) {
        throw Error(
            j.error ||
            `Chat service error (${r.status}). Check chat-api/config.php and MySQL setup.`
        );
    }

    return j;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

function toast(s) {

    $('co-toast').textContent = s;
    $('co-toast').style.display = 'block';

    clearTimeout(toast.t);

    toast.t = setTimeout(() => {
        $('co-toast').style.display = 'none';
    }, 3500);

}

// ==========================================
// AUTHENTICATION
// ==========================================

async function token() {

    auth = JSON.parse(
        localStorage.getItem('li_auth') || 'null'
    );

    if (!auth) {
        throw Error('Sign in to Lucuma Docs first.');
    }

    if (auth.exp - 60 < Date.now() / 1000) {

        const r = await fetch(
            API + '/auth/v1/token?grant_type=refresh_token',
            {
                method: 'POST',
                headers: {
                    apikey: CFG.anonKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: auth.refresh
                })
            }
        );

        const j = await r.json();

        if (!r.ok) {
            throw Error('Session expired. Sign in again.');
        }

        auth = {
            access: j.access_token,
            refresh: j.refresh_token,
            exp: Math.floor(Date.now() / 1000) + j.expires_in,
            uid: j.user.id,
            email: j.user.email
        };

        localStorage.setItem(
            'li_auth',
            JSON.stringify(auth)
        );

    }

    return auth.access;

}

// ==========================================
// SUPABASE DATABASE
// ==========================================

async function db(table, query = '', opts = {}) {

    const t = await token();

    const r = await fetch(
        API + '/rest/v1/' + table +
        (query ? '?' + query : ''),
        {
            method: opts.method || 'GET',

            headers: {
                apikey: CFG.anonKey,
                Authorization: 'Bearer ' + t,
                'Content-Type': 'application/json',
                Prefer: opts.prefer || 'return=representation',
                ...(opts.headers || {})
            },

            body: opts.body
                ? JSON.stringify(opts.body)
                : undefined
        }
    );

    const j = await r.json().catch(() => null);

    if (!r.ok) {

        throw Error(
            j?.message ||
            j?.hint ||
            `Database request failed (${r.status}). Apply the supplied SQL migration and verify RLS policies.`
        );

    }

    return j;

}

// ==========================================
// USER ROLES
// ==========================================

const role = () => me?.role || 'member';

const manager = () =>
    ['admin', 'ceo', 'cto'].includes(role());

// ==========================================
// INITIALIZATION
// ==========================================

async function init() {

    if (!API || !CFG.anonKey) {
        throw Error('Supabase config is missing.');
    }

    auth = JSON.parse(
        localStorage.getItem('li_auth') || 'null'
    );

    if (!auth) {
        throw Error('Please sign in through Lucuma Docs first.');
    }

    const p = await db(
        'profiles',
        'select=id,name,email,role,active&id=eq.' +
        encodeURIComponent(auth.uid)
    );

    me = p?.[0];

    if (!me || me.active === false) {
        throw Error(
            'Your account is inactive or its profile could not be loaded.'
        );
    }

    $('co-user').textContent =
        (me.name || me.email) +
        ' · ' +
        role().toUpperCase();

    people = await db(
        'profiles',
        'select=id,name,email,role,active&active=eq.true&order=name.asc'
    );

    $('new-task').hidden = !manager();

    fillPeople();

    await loadTasks();

    await loadConversations();

    if (poll) {
        clearInterval(poll);
    }

    // Refresh messages and conversations every 6 seconds.
    poll = setInterval(() => {

        if (activeConversation) {
            loadMessages().catch(() => {});
        }

        loadConversations().catch(() => {});

    }, 6000);

}

// ==========================================
// EMPLOYEE LIST
// ==========================================

function fillPeople() {

    const opts = people
        .filter(p => p.id !== me.id)
        .map(p => `
            <option value="${p.id}">
                ${esc(p.name || p.email)} · ${esc(p.role)}
            </option>
        `)
        .join('');

    $('t-assignee').innerHTML =
        '<option value="">Choose employee</option>' + opts;

    $('c-members').innerHTML = opts;

}

// ==========================================
// TASK MANAGEMENT
// ==========================================

async function loadTasks() {

    tasks = await db(
        'tasks',
        'select=*&order=created_at.desc&limit=250'
    );

    renderTasks();

}

function renderTasks() {

    const mine = tasks.filter(t =>
        t.created_by === me.id ||
        (t.assignee_ids || []).includes(me.id)
    );

    const visible = manager() ? tasks : mine;

    $('task-stats').innerHTML = [
        ['Visible', visible.length],
        [
            'In progress',
            visible.filter(t => t.status === 'in_progress').length
        ],
        [
            'Completed',
            visible.filter(t => t.status === 'completed').length
        ],
        [
            'Overdue',
            visible.filter(t =>
                t.due_date &&
                t.due_date < new Date().toISOString().slice(0, 10) &&
                t.status !== 'completed'
            ).length
        ]

    ].map(x => `
        <div class="stat-card">
            <small>${x[0]}</small>
            <b>${x[1]}</b>
        </div>
    `).join('');

    $('task-list').innerHTML = visible.length

        ? visible.map(t => {

            const ass = (t.assignee_ids || [])
                .map(id =>
                    people.find(p => p.id === id)?.name ||
                    'Team member'
                )
                .join(', ');

            return `
                <article class="task-card">

                    <div class="task-head">

                        <div>
                            <h3>${esc(t.title)}</h3>

                            <div class="muted">
                                ${esc(t.description || 'No description')}
                                · Assigned: ${esc(ass || '—')}
                            </div>
                        </div>

                        <span class="pill">
                            ${esc((t.priority || 'medium').toUpperCase())}
                            ·
                            ${esc(t.status || 'assigned')}
                        </span>

                    </div>

                    <div class="progress">
                        <span style="width:${Math.max(
                            0,
                            Math.min(100, +t.progress || 0)
                        )}%"></span>
                    </div>

                    <div class="muted">
                        ${+t.progress || 0}% overall
                        · Due ${esc(t.due_date || 'Not set')}
                    </div>

                    <div class="task-actions">

                        <button data-update="${t.id}">
                            Update progress + remark
                        </button>

                        <button data-history="${t.id}">
                            Activity history
                        </button>

                        ${manager() ? `
                            <button data-edit-task="${t.id}">
                                Edit task
                            </button>

                            <button
                                data-delete-task="${t.id}"
                                class="danger"
                            >
                                Delete
                            </button>
                        ` : ''}

                    </div>

                    <div id="history-${t.id}" hidden></div>

                </article>
            `;

        }).join('')

        : `
            <div class="task-card">
                No tasks available.
                Authorized managers can create the first task.
            </div>
        `;

}

// ==========================================
// CREATE TASK
// ==========================================

async function createTask(e) {

    e.preventDefault();

    const assignee = $('t-assignee').value;

    if (!assignee) {
        throw Error('Select an assignee.');
    }

    await db('tasks', '', {
        method: 'POST',

        body: {
            title: $('t-title').value.trim(),
            description: $('t-description').value.trim(),
            created_by: me.id,
            assignee_ids: [assignee],
            priority: $('t-priority').value,
            due_date: $('t-due').value || null,
            status: 'assigned',
            progress: 0
        }
    });

    $('task-dialog').close();

    $('task-form').reset();

    await loadTasks();

    toast('Task assigned.');

}

// ==========================================
// TASK PROGRESS
// ==========================================

async function submitUpdate(e) {

    e.preventDefault();

    if (!activeTask) {
        throw Error('Select a task.');
    }

    const remark = $('u-remark').value.trim();

    if (remark.length < 3) {
        throw Error('A progress remark is required.');
    }

    const progress = Math.max(
        0,
        Math.min(100, +$('u-progress').value)
    );

    const status = $('u-status').value;

    await db('task_progress_updates', '', {

        method: 'POST',

        body: {
            task_id: activeTask.id,
            user_id: me.id,
            status,
            progress,
            remark
        }

    });

    if (manager()) {

        const updates = await db(
            'task_progress_updates',
            'select=user_id,progress,created_at&task_id=eq.' +
            activeTask.id +
            '&order=created_at.desc'
        );

        const latest = new Map();

        updates.forEach(x => {

            if (!latest.has(x.user_id)) {
                latest.set(x.user_id, x.progress);
            }

        });

        const vals = [...latest.values()];

        const avg = vals.length
            ? Math.round(
                vals.reduce((n, x) => n + x, 0) / vals.length
            )
            : progress;

        await db(
            'tasks',
            'id=eq.' + activeTask.id,
            {
                method: 'PATCH',

                body: {
                    status,
                    progress: avg,
                    updated_at: new Date().toISOString()
                }
            }
        );

    }

    $('update-dialog').close();

    $('update-form').reset();

    await loadTasks();

    toast('Progress and timestamped remark saved.');

}

// ==========================================
// TASK HISTORY
// ==========================================

async function showHistory(id) {

    const box = $('history-' + id);

    if (!box.hidden) {
        box.hidden = true;
        return;
    }

    const rows = await db(
        'task_progress_updates',
        'select=*,profiles(name,role)&task_id=eq.' +
        id +
        '&order=created_at.asc'
    );

    box.hidden = false;

    box.classList.add('activity-timeline');

    box.innerHTML = rows.length

        ? `
            <div class="timeline-track">

                ${rows.map((r, i) => `

                    <article
                        class="timeline-entry"
                        style="--i:${i}"
                    >

                        <span class="timeline-dot"></span>

                        <div class="timeline-card">

                            <b>
                                ${esc(r.profiles?.name || 'Team member')}
                            </b>

                            <small>
                                ${esc(r.profiles?.role || '')}
                                ·
                                ${new Date(r.created_at).toLocaleString()}
                            </small>

                            <strong>
                                ${esc(r.status)} · ${r.progress}%
                            </strong>

                            <p>${esc(r.remark)}</p>

                        </div>

                    </article>

                `).join('')}

            </div>
        `

        : '<p class="muted">No progress updates yet.</p>';

}

// ==========================================
// LUCUMA CONNECT
// ==========================================

async function loadConversations() {

    const result = await chatApi('list_conversations');

    conversations = result.conversations || [];

    $('conversations').innerHTML = conversations.length

        ? conversations.map(c => `

            <div class="conversation-row ${
                String(activeConversation?.id) === String(c.id) ? 'active' : ''
            }">

                <button
                    type="button"
                    class="conversation"
                    data-conversation="${esc(c.id)}"
                >
                    <span>${esc(
                        c.display_name ||
                        c.name ||
                        'Direct message'
                    )}</span>
                    <small>${esc(c.kind)}</small>
                </button>

                <button
                    type="button"
                    class="conversation-delete"
                    data-delete-conversation="${esc(c.id)}"
                    aria-label="Delete chat for me"
                    title="Delete chat for me"
                >×</button>

            </div>

        `).join('')

        : '<p class="muted">No conversations yet.</p>';

}

// ==========================================
// CREATE CONVERSATION
// ==========================================

async function createConversation(e) {

    e.preventDefault();

    const kind = $('c-kind').value;

    const selected = [
        ...$('c-members').selectedOptions
    ].map(o => o.value);

    if (!selected.length) {
        throw Error('Select at least one participant.');
    }

    if (kind === 'direct' && selected.length !== 1) {
        throw Error(
            'Choose exactly one person for a direct conversation.'
        );
    }

    const name = kind === 'group'

        ? $('c-name').value.trim()

        : people.find(p => p.id === selected[0])?.name ||
          'Direct conversation';

    if (kind === 'group' && !name) {
        throw Error('Enter a group name.');
    }

    const result = await chatApi(
        'create_conversation',
        {
            kind,
            name,
            members: selected
        }
    );

    $('chat-dialog').close();

    $('chat-form').reset();

    await loadConversations();

    await openConversation(result.conversation.id);

}

// ==========================================
// OPEN CONVERSATION
// ==========================================

async function openConversation(id) {

    activeConversation = conversations.find(
        c => String(c.id) === String(id)
    ) || null;

    if (!activeConversation) {

        await loadConversations();

        activeConversation = conversations.find(
            c => String(c.id) === String(id)
        ) || null;

    }

    if (!activeConversation) {

        throw Error(
            'Conversation not found or you are not a member.'
        );

    }

    // Use the other participant's name for direct messages.
    // Group conversations retain their original group name.

    $('chat-title').textContent =

        activeConversation.kind === 'direct'

            ? (
                activeConversation.display_name ||
                activeConversation.name ||
                'Direct message'
            )

            : (
                activeConversation.name ||
                'Group conversation'
            );

    await loadConversations();

    await loadMessages();

}

// ==========================================
// LOAD MESSAGES
// ==========================================

async function loadMessages() {

    if (!activeConversation) {
        return;
    }

    const result = await chatApi(
        'list_messages',
        {
            conversation_id: activeConversation.id
        }
    );

    const rows = result.messages || [];

    $('messages').innerHTML = rows.map(m => {

        const isMine = String(m.sender_id) === String(me.id);
        const isDeleted = Boolean(m.deleted_for_everyone_at);
        const senderName = isMine ? 'You' : (m.sender_name || 'Team member');
        const timestamp = new Date(m.created_at).toLocaleString();

        const controls = isDeleted ? '' : `
            <div class="message-actions">
                ${isMine ? `<button type="button" data-edit-message="${m.id}">Edit</button>` : ''}
                <button type="button" data-delete-message="${m.id}" data-delete-mode="for_me">Delete for me</button>
                ${isMine ? `<button type="button" data-delete-message="${m.id}" data-delete-mode="for_everyone">Delete for everyone</button>` : ''}
            </div>
        `;

        return `
            <div class="bubble ${isMine ? 'mine' : ''} ${isDeleted ? 'deleted' : ''}">
                <div class="bubble-body">${isDeleted ? 'This message was deleted.' : esc(m.body)}</div>
                <small>
                    ${esc(senderName)} · ${esc(timestamp)}
                    ${m.edited_at && !isDeleted ? ' · Edited' : ''}
                </small>
                ${controls}
            </div>
        `;

    }).join('');

    $('messages').scrollTop =
        $('messages').scrollHeight;

}

// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage(e) {

    e.preventDefault();

    const body = $('message-input').value.trim();

    if (!body || !activeConversation) {
        return;
    }

    const sendButton = $('message-form').querySelector(
        'button[type="submit"]'
    );

    if (sendButton) {
        sendButton.disabled = true;
    }

    try {

        await chatApi(
            'send_message',
            {
                conversation_id: activeConversation.id,
                body
            }
        );

        $('message-input').value = '';

        await loadMessages();

    } finally {

        if (sendButton) {
            sendButton.disabled = false;
        }

    }

}

// ==========================================
// TAB SWITCHING
// ==========================================

document.querySelectorAll('[data-tab]').forEach(b => {

    b.addEventListener('click', () => {

        document.querySelectorAll('[data-tab]').forEach(x => {

            x.classList.toggle(
                'active',
                x === b
            );

        });

        $('tasks').hidden =
            b.dataset.tab !== 'tasks';

        $('chat').hidden =
            b.dataset.tab !== 'chat';

    });

});

// ==========================================
// EVENT HANDLERS
// ==========================================

document.addEventListener('click', async e => {

    // Update task

    const u = e.target.closest('[data-update]');

    if (u) {

        activeTask = tasks.find(
            t => t.id === u.dataset.update
        );

        $('u-progress').value =
            activeTask?.progress || 0;

        $('update-dialog').showModal();

    }

    // Edit task

    const et = e.target.closest('[data-edit-task]');

    if (et) {

        const t = tasks.find(
            x => x.id === et.dataset.editTask
        );

        if (t) {

            const title = prompt(
                'Task title',
                t.title
            );

            if (title === null) return;

            const description = prompt(
                'Task description',
                t.description || ''
            );

            if (description === null) return;

            const due = prompt(
                'Due date (YYYY-MM-DD, leave blank for none)',
                t.due_date || ''
            );

            if (due === null) return;

            await db(
                'tasks',
                'id=eq.' + t.id,
                {
                    method: 'PATCH',

                    body: {
                        title: title.trim(),
                        description: description.trim(),
                        due_date: due || null,
                        updated_at: new Date().toISOString()
                    }
                }
            );

            await loadTasks();

            toast('Task updated.');

        }

        return;

    }

    // Delete task

    const del = e.target.closest('[data-delete-task]');

    if (del && manager()) {

        if (!confirm(
            'Delete this task and its progress history?'
        )) {
            return;
        }

        const taskId = del.dataset.deleteTask;

        await db(
            'tasks',
            'id=eq.' + taskId,
            {
                method: 'DELETE',
                prefer: 'return=minimal'
            }
        );

        await loadTasks();

        if (tasks.some(t => t.id === taskId)) {

            throw Error(
                'Task was not deleted. Apply the tasks_delete_management policy from the SQL repair file.'
            );

        }

        toast('Task deleted.');

        return;

    }

    // Task history

    const h = e.target.closest('[data-history]');

    if (h) {

        showHistory(h.dataset.history)
            .catch(x => toast(x.message));

    }

    // Open conversation

    const c = e.target.closest('[data-conversation]');

    if (c) {

        openConversation(c.dataset.conversation)
            .catch(x => toast(x.message));

    }

    // Delete a conversation only from the current user's chat list.
    const deleteChat = e.target.closest('[data-delete-conversation]');

    if (deleteChat) {
        e.preventDefault();
        e.stopPropagation();

        const conversationId = deleteChat.dataset.deleteConversation;

        if (!confirm('Delete this chat from your chat list? Other participants will keep their messages.')) {
            return;
        }

        try {
            await chatApi('delete_conversation', {
                conversation_id: conversationId
            });

            if (String(activeConversation?.id) === String(conversationId)) {
                activeConversation = null;
                $('chat-title').textContent = 'Select a conversation';
                $('messages').innerHTML = '';
            }

            await loadConversations();
            toast('Chat deleted from your list.');
        } catch (error) {
            toast(error.message);
        }

        return;
    }

    // Edit a message sent by the current user.
    const editMessage = e.target.closest('[data-edit-message]');

    if (editMessage) {
        const messageId = Number(editMessage.dataset.editMessage);
        const bubble = editMessage.closest('.bubble');
        const currentText = bubble?.querySelector('.bubble-body')?.textContent || '';
        const updatedText = prompt('Edit your message:', currentText);

        if (updatedText === null) return;
        if (!updatedText.trim()) {
            toast('Message cannot be empty.');
            return;
        }

        try {
            await chatApi('edit_message', {
                message_id: messageId,
                body: updatedText.trim()
            });
            await loadMessages();
            toast('Message edited.');
        } catch (error) {
            toast(error.message);
        }

        return;
    }

    // Delete a message for the current user or everyone.
    const deleteMessage = e.target.closest('[data-delete-message]');

    if (deleteMessage) {
        const messageId = Number(deleteMessage.dataset.deleteMessage);
        const mode = deleteMessage.dataset.deleteMode;

        const confirmation = mode === 'for_everyone'
            ? 'Delete this message for everyone? This cannot be undone.'
            : 'Delete this message only from your view?';

        if (!confirm(confirmation)) return;

        try {
            await chatApi('delete_message', {
                message_id: messageId,
                mode
            });
            await loadMessages();
            toast(mode === 'for_everyone' ? 'Message deleted for everyone.' : 'Message deleted for you.');
        } catch (error) {
            toast(error.message);
        }

        return;
    }

    // Close dialogs

    if (e.target.matches('[data-close]')) {

        e.target.closest('dialog').close();

    }

});

// ==========================================
// FORM EVENTS
// ==========================================

$('new-task').addEventListener('click', () => {

    $('task-dialog').showModal();

});

$('new-chat').addEventListener('click', () => {

    $('chat-dialog').showModal();

});

$('task-form').addEventListener('submit', e => {

    createTask(e).catch(x => toast(x.message));

});

$('update-form').addEventListener('submit', e => {

    submitUpdate(e).catch(x => toast(x.message));

});

$('chat-form').addEventListener('submit', e => {

    createConversation(e).catch(x => toast(x.message));

});

$('message-form').addEventListener('submit', e => {

    sendMessage(e).catch(x => toast(x.message));

});

$('co-refresh').addEventListener('click', () => {

    init().catch(x => toast(x.message));

});

$('c-kind').addEventListener('change', () => {

    $('c-name').disabled =
        $('c-kind').value !== 'group';

});

// ==========================================
// START APPLICATION
// ==========================================

init().catch(e => {

    $('co-user').textContent = e.message;

    toast(e.message);

});

})();