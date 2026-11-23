<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| LUCUMA INNOVATIONS - CHAT API
|--------------------------------------------------------------------------
| Authentication : Supabase
| Database       : MySQL
| Messaging      : Private conversations
| Message fetch  : Incremental polling
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

$cfg = require __DIR__ . '/config.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '') {

    $allowed = $cfg['allowed_origin'] ?? '';

    if ($allowed !== '' && $origin !== $allowed) {

        http_response_code(403);

        echo json_encode([
            'error' => 'Origin not allowed.'
        ]);

        exit;
    }

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

/*
|--------------------------------------------------------------------------
| PREFLIGHT REQUEST
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'error' => 'Method not allowed.'
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| ERROR HANDLING
|--------------------------------------------------------------------------
*/

function fail(string $message, int $code = 400): never {

    http_response_code($code);

    echo json_encode([
        'error' => $message
    ]);

    exit;
}

set_exception_handler(function (Throwable $e): void {

    error_log(
        'Lucuma Chat API: ' . $e->getMessage()
    );

    fail(
        'Chat server error. Check MySQL configuration and PHP error logs.',
        500
    );

});

/*
|--------------------------------------------------------------------------
| SUPABASE HTTP REQUEST
|--------------------------------------------------------------------------
*/

function http_json(
    string $url,
    string $anon,
    string $jwt
): array {

    $ch = curl_init($url);

    curl_setopt_array($ch, [

        CURLOPT_RETURNTRANSFER => true,

        CURLOPT_TIMEOUT => 12,

        CURLOPT_CONNECTTIMEOUT => 5,

        CURLOPT_HTTPHEADER => [

            'apikey: ' . $anon,

            'Authorization: Bearer ' . $jwt,

            'Accept: application/json'

        ]

    ]);

    $raw = curl_exec($ch);

    $status = (int) curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

    $curlError = curl_error($ch);

    curl_close($ch);

    if ($raw === false) {

        error_log('Supabase cURL error: ' . $curlError);

        fail('Unable to connect to authentication service.', 502);
    }

    $data = json_decode($raw, true);

    if (
        $status < 200 ||
        $status >= 300 ||
        !is_array($data)
    ) {

        fail('Unable to validate your Lucuma account.', 401);
    }

    return $data;
}

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if (!preg_match('/Bearer\s+(.+)/i', $authHeader, $match)) {

    fail('Please sign in to Lucuma Docs first.', 401);
}

$jwt = trim($match[1]);

$supabase = rtrim(
    $cfg['supabase_url'],
    '/'
);

/* Validate Supabase session */

$user = http_json(

    $supabase . '/auth/v1/user',

    $cfg['supabase_anon_key'],

    $jwt

);

$uid = $user['id'] ?? '';

if (!$uid) {

    fail('Invalid login session.', 401);
}

/*
|--------------------------------------------------------------------------
| LOAD USER PROFILE
|--------------------------------------------------------------------------
*/

$profiles = http_json(

    $supabase .
    '/rest/v1/profiles?id=eq.' .
    rawurlencode($uid) .
    '&select=id,name,email,role,active',

    $cfg['supabase_anon_key'],

    $jwt

);

$profile = $profiles[0] ?? null;

if (!$profile || empty($profile['active'])) {

    fail('Your Lucuma account is inactive.', 403);
}

/*
|--------------------------------------------------------------------------
| MYSQL CONNECTION
|--------------------------------------------------------------------------
*/

$pdo = new PDO(

    'mysql:host=' . $cfg['db_host'] .
    ';dbname=' . $cfg['db_name'] .
    ';charset=utf8mb4',

    $cfg['db_user'],

    $cfg['db_pass'],

    [

        PDO::ATTR_ERRMODE =>
            PDO::ERRMODE_EXCEPTION,

        PDO::ATTR_DEFAULT_FETCH_MODE =>
            PDO::FETCH_ASSOC,

        PDO::ATTR_EMULATE_PREPARES =>
            false

    ]

);

/*
|--------------------------------------------------------------------------
| CACHE USER PROFILE
|--------------------------------------------------------------------------
*/

$cache = $pdo->prepare(

    'INSERT INTO lucuma_chat_profiles
    (id, name, email)
    VALUES (?, ?, ?)

    ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email)'

);

$cache->execute([

    $uid,

    $profile['name'] ?? null,

    $profile['email'] ?? null

]);

/*
|--------------------------------------------------------------------------
| REQUEST BODY
|--------------------------------------------------------------------------
*/

$input = json_decode(

    file_get_contents('php://input'),

    true

);

if (!is_array($input)) {

    fail('Invalid request body.');
}

$action = $input['action'] ?? '';

/*
|--------------------------------------------------------------------------
| CONVERSATION MEMBERSHIP VALIDATION
|--------------------------------------------------------------------------
*/

function member(
    PDO $pdo,
    string $cid,
    string $uid
): bool {

    $query = $pdo->prepare(

        'SELECT 1
         FROM lucuma_chat_members
         WHERE conversation_id = ?
         AND user_id = ?
         LIMIT 1'

    );

    $query->execute([

        $cid,

        $uid

    ]);

    return (bool) $query->fetchColumn();
}

/*
|--------------------------------------------------------------------------
| ACTION 1: LIST CONVERSATIONS
|--------------------------------------------------------------------------
| Users can only see conversations they belong to.
|--------------------------------------------------------------------------
*/

if ($action === 'list_conversations') {

    $query = $pdo->prepare(

        'SELECT
            c.id,
            c.name,
            c.kind,
            c.created_at,

            CASE
                WHEN c.kind = "direct"
                THEN COALESCE(
                    other_profile.name,
                    other_profile.email,
                    "Team member"
                )
                ELSE c.name
            END AS display_name,

            other_member.user_id AS other_user_id

        FROM lucuma_chat_conversations c

        INNER JOIN lucuma_chat_members current_member
            ON current_member.conversation_id = c.id

        LEFT JOIN lucuma_chat_members other_member
            ON other_member.conversation_id = c.id
            AND other_member.user_id != ?

        LEFT JOIN lucuma_chat_profiles other_profile
            ON other_profile.id = other_member.user_id

        WHERE current_member.user_id = ?
          AND current_member.hidden_at IS NULL

        ORDER BY c.created_at DESC'

    );

    $query->execute([
        $uid,
        $uid
    ]);

    echo json_encode([

        'conversations' => $query->fetchAll()

    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| ACTION 2: DELETE CONVERSATION FOR CURRENT USER
|--------------------------------------------------------------------------
| This hides the conversation only for the signed-in member.
| Other participants retain their chat history.
|--------------------------------------------------------------------------
*/

if ($action === 'delete_conversation') {

    $cid = (string) ($input['conversation_id'] ?? '');

    if (!preg_match('/^[a-f0-9]{32}$/i', $cid)) {
        fail('Invalid conversation.');
    }

    if (!member($pdo, $cid, $uid)) {
        fail('Conversation access denied.', 403);
    }

    $query = $pdo->prepare(
        'UPDATE lucuma_chat_members
         SET hidden_at = CURRENT_TIMESTAMP
         WHERE conversation_id = ? AND user_id = ?'
    );
    $query->execute([$cid, $uid]);

    echo json_encode(['ok' => true]);
    exit;
}

/*
|--------------------------------------------------------------------------
| ACTION 2: CREATE CONVERSATION
|--------------------------------------------------------------------------
*/

if ($action === 'create_conversation') {

    $kind = ($input['kind'] ?? '') === 'group'
        ? 'group'
        : 'direct';

    $name = trim(
        (string) ($input['name'] ?? '')
    );

    $members = $input['members'] ?? [];

    if (!is_array($members)) {

        fail('Invalid participant list.');
    }

    $members = array_values(

        array_unique(

            array_filter(

                $members,

                fn($id) =>
                    is_string($id) && $id !== ''

            )

        )

    );

    if (
        !$members ||
        ($kind === 'direct' && count($members) !== 1) ||
        count($members) > 30
    ) {

        fail('Choose valid conversation participants.');
    }

    if ($kind === 'group' && $name === '') {

        fail('Enter a group name.');
    }

    /* Remove current user from selected participants */

    $members = array_values(

        array_diff($members, [$uid])

    );

    if (!$members) {

        fail('Choose at least one other participant.');
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE EVERY PARTICIPANT
    |--------------------------------------------------------------------------
    */

    foreach ($members as $id) {

        $rows = http_json(

            $supabase .
            '/rest/v1/profiles?id=eq.' .
            rawurlencode($id) .
            '&select=id,active',

            $cfg['supabase_anon_key'],

            $jwt

        );

        if (empty($rows[0]['active'])) {

            fail(
                'One selected participant is inactive or unavailable.',
                403
            );
        }

        $info = http_json(

            $supabase .
            '/rest/v1/profiles?id=eq.' .
            rawurlencode($id) .
            '&select=id,name,email',

            $cfg['supabase_anon_key'],

            $jwt

        )[0] ?? [];

        $cache->execute([

            $id,

            $info['name'] ?? null,

            $info['email'] ?? null

        ]);

    }

    /*
    |--------------------------------------------------------------------------
    | CREATE CONVERSATION
    |--------------------------------------------------------------------------
    */

    $cid = bin2hex(random_bytes(16));

    $pdo->beginTransaction();

    try {

        $query = $pdo->prepare(

            'INSERT INTO lucuma_chat_conversations
            (id, name, kind, created_by)
            VALUES (?, ?, ?, ?)'

        );

        $query->execute([

            $cid,

            $name,

            $kind,

            $uid

        ]);

        /*
        | Add creator
        */

        $query = $pdo->prepare(

            'INSERT INTO lucuma_chat_members
            (conversation_id, user_id)
            VALUES (?, ?)'

        );

        $query->execute([

            $cid,

            $uid

        ]);

        /*
        | Add participants
        */

        foreach ($members as $id) {

            $query->execute([

                $cid,

                $id

            ]);

        }

        $pdo->commit();

    } catch (Throwable $e) {

        $pdo->rollBack();

        throw $e;
    }

    echo json_encode([

        'ok' => true,

        'conversation' => [

            'id' => $cid,

            'name' => $name,

            'kind' => $kind

        ]

    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| ACTION 3: LIST MESSAGES
|--------------------------------------------------------------------------
| Only conversation members can retrieve messages.
| after_id enables incremental message fetching.
|--------------------------------------------------------------------------
*/

if ($action === 'list_messages') {

    $cid = (string) (
        $input['conversation_id'] ?? ''
    );

    $afterId = filter_var(

        $input['after_id'] ?? 0,

        FILTER_VALIDATE_INT

    );

    if ($afterId === false || $afterId < 0) {

        fail('Invalid message cursor.');
    }

    /*
    | Verify conversation membership
    */

    if (!member($pdo, $cid, $uid)) {

        fail('Conversation access denied.', 403);
    }

    /*
    | Fetch only messages newer than after_id
    */

    $query = $pdo->prepare(

        'SELECT

            m.id,

            m.conversation_id,

            m.sender_id,

            m.body,

            m.created_at,

            m.edited_at,

            m.deleted_for_everyone_at,

            COALESCE(
                p.name,
                p.email,
                "Team member"
            ) AS sender_name

         FROM lucuma_chat_messages m

         LEFT JOIN lucuma_chat_profiles p
           ON p.id = m.sender_id

         LEFT JOIN lucuma_chat_message_deletions d
           ON d.message_id = m.id AND d.user_id = ?

         WHERE m.conversation_id = ?
           AND m.id > ?
           AND d.message_id IS NULL

         ORDER BY m.id ASC

         LIMIT 300'

    );

    $query->execute([

        $uid,

        $cid,

        $afterId

    ]);

    echo json_encode([

        'messages' => $query->fetchAll()

    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| ACTION 4: SEND MESSAGE
|--------------------------------------------------------------------------
| Messages are saved in MySQL.
| Only conversation members can send messages.
|--------------------------------------------------------------------------
*/

if ($action === 'send_message') {

    $cid = (string) (
        $input['conversation_id'] ?? ''
    );

    $body = trim(

        (string) ($input['body'] ?? '')

    );

    /*
    | Validate membership
    */

    if (!member($pdo, $cid, $uid)) {

        fail('Conversation access denied.', 403);
    }

    /*
    | Validate message
    */

    if (
        $body === '' ||
        mb_strlen($body, 'UTF-8') > 5000
    ) {

        fail(
            'Message must contain 1–5000 characters.'
        );
    }

    /*
    | A new message makes the conversation visible again for
    | participants who previously cleared it from their own list.
    */

    $query = $pdo->prepare(
        'UPDATE lucuma_chat_members
         SET hidden_at = NULL
         WHERE conversation_id = ?'
    );
    $query->execute([$cid]);

    /*
    | Insert message
    */

    $query = $pdo->prepare(

        'INSERT INTO lucuma_chat_messages

        (conversation_id, sender_id, body)

        VALUES (?, ?, ?)'

    );

    $query->execute([

        $cid,

        $uid,

        $body

    ]);

    $messageId = (int) $pdo->lastInsertId();

    /*
    | Return the newly created message.
    | collaboration.js uses this response
    | to display the message immediately.
    */

    $query = $pdo->prepare(

        'SELECT

            m.id,

            m.conversation_id,

            m.sender_id,

            m.body,

            m.created_at,

            m.edited_at,

            m.deleted_for_everyone_at,

            COALESCE(
                p.name,
                p.email,
                "Team member"
            ) AS sender_name

        FROM lucuma_chat_messages m

        LEFT JOIN lucuma_chat_profiles p

        ON p.id = m.sender_id

        WHERE m.id = ?

        LIMIT 1'

    );

    $query->execute([$messageId]);

    $message = $query->fetch();

    echo json_encode([

        'ok' => true,

        'message' => $message

    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| ACTION 6: EDIT MESSAGE
|--------------------------------------------------------------------------
| Only the original sender can edit their own message.
|--------------------------------------------------------------------------
*/

if ($action === 'edit_message') {

    $messageId = filter_var($input['message_id'] ?? null, FILTER_VALIDATE_INT);
    $body = trim((string) ($input['body'] ?? ''));

    if (!$messageId || $body === '' || mb_strlen($body, 'UTF-8') > 5000) {
        fail('Message must contain 1–5000 characters.');
    }

    $query = $pdo->prepare(
        'SELECT conversation_id, sender_id, deleted_for_everyone_at
         FROM lucuma_chat_messages WHERE id = ? LIMIT 1'
    );
    $query->execute([$messageId]);
    $message = $query->fetch();

    if (!$message || !member($pdo, (string)$message['conversation_id'], $uid)) {
        fail('Message not found or access denied.', 404);
    }

    if ($message['sender_id'] !== $uid) {
        fail('You can only edit messages you sent.', 403);
    }

    if ($message['deleted_for_everyone_at'] !== null) {
        fail('A deleted message cannot be edited.');
    }

    $query = $pdo->prepare(
        'UPDATE lucuma_chat_messages
         SET body = ?, edited_at = CURRENT_TIMESTAMP
         WHERE id = ? AND sender_id = ? AND deleted_for_everyone_at IS NULL'
    );
    $query->execute([$body, $messageId, $uid]);

    echo json_encode(['ok' => true]);
    exit;
}

/*
|--------------------------------------------------------------------------
| ACTION 7: DELETE MESSAGE
|--------------------------------------------------------------------------
| mode=for_me hides the message only for this member.
| mode=for_everyone removes its content for every participant.
|--------------------------------------------------------------------------
*/

if ($action === 'delete_message') {

    $messageId = filter_var($input['message_id'] ?? null, FILTER_VALIDATE_INT);
    $mode = (string) ($input['mode'] ?? 'for_me');

    if (!$messageId || !in_array($mode, ['for_me', 'for_everyone'], true)) {
        fail('Invalid message deletion request.');
    }

    $query = $pdo->prepare(
        'SELECT conversation_id, sender_id, deleted_for_everyone_at
         FROM lucuma_chat_messages WHERE id = ? LIMIT 1'
    );
    $query->execute([$messageId]);
    $message = $query->fetch();

    if (!$message || !member($pdo, (string)$message['conversation_id'], $uid)) {
        fail('Message not found or access denied.', 404);
    }

    if ($mode === 'for_everyone') {

        if ($message['sender_id'] !== $uid) {
            fail('You can only delete your own messages for everyone.', 403);
        }

        if ($message['deleted_for_everyone_at'] === null) {
            $query = $pdo->prepare(
                'UPDATE lucuma_chat_messages
                 SET body = ?, deleted_for_everyone_at = CURRENT_TIMESTAMP,
                     deleted_by = ?, edited_at = NULL
                 WHERE id = ? AND sender_id = ?'
            );
            $query->execute(['', $uid, $messageId, $uid]);
        }

    } else {

        $query = $pdo->prepare(
            'INSERT IGNORE INTO lucuma_chat_message_deletions (message_id, user_id)
             VALUES (?, ?)'
        );
        $query->execute([$messageId, $uid]);

    }

    echo json_encode(['ok' => true]);
    exit;
}

/*
|--------------------------------------------------------------------------
| UNKNOWN ACTION
|--------------------------------------------------------------------------
*/

fail('Unknown chat action.');
