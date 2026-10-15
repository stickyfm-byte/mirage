<?php
declare(strict_types=1);

/* Set MIRAGE_DISCORD_WEBHOOK in the server environment. Requires PHP 7.4+ and cURL. */
function respond(int $status, string $message): never {
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    $safe = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Application</title><body style="font:16px system-ui;max-width:680px;margin:12vh auto;padding:24px;background:#071827;color:#eef6ff"><h1>Mirage Applications</h1><p>'.$safe.'</p><p><a style="color:#8bd4ff" href="/forms/">Return to applications</a></p></body></html>';
    exit;
}
function cut_text(string $s, int $max): string {
    if (function_exists('mb_substr')) return mb_substr($s, 0, $max, 'UTF-8');
    return substr($s, 0, $max);
}
function text_len(string $s): int {
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST'); respond(405, 'Please submit your application using the form.');
}
if (!empty($_POST['_honeypot'])) respond(200, 'Thank you. Your application has been received.');

$webhook = getenv('MIRAGE_DISCORD_WEBHOOK');
if (!$webhook || !filter_var($webhook, FILTER_VALIDATE_URL) ||
    !preg_match('~^https://(ptb\\.)?discord(app)?\\.com/api/webhooks/\\d+/[A-Za-z0-9._-]+$~', $webhook)) {
    error_log('Mirage applications: MIRAGE_DISCORD_WEBHOOK is missing or invalid.');
    respond(500, 'Applications are temporarily unavailable. Please contact applications@miragesmp.org.');
}
$allowed = [
    'Role'=>80, 'Minecraft Username'=>100, 'Email'=>200, 'Discord'=>100, 'Age'=>10,
    'Timezone'=>100, 'Availability'=>300, 'Writing Experience'=>1800, 'Portfolio'=>1000,
    'Why Script Writer'=>1500, 'Story Approach'=>1500, 'Writing Sample'=>2500, 'Teamwork'=>1200,
    'Application'=>3000, 'Additional Information'=>1500
];
$role = trim((string)($_POST['Role'] ?? 'Application'));
$fields = [];
foreach ($allowed as $name=>$limit) {
    $value = $name === 'Role' ? $role : trim((string)($_POST[$name] ?? ''));
    $value = preg_replace('/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/u', '', $value) ?? '';
    $value = cut_text($value, $limit);
    if ($value !== '') $fields[$name] = $value;
}
if (empty($fields['Minecraft Username']) || empty($fields['Email']) || empty($fields['Discord']) ||
    empty($fields['Age']) || (!isset($fields['Application']) && $role !== 'Script Writer')) {
    respond(400, 'Some required information is missing. Please go back and complete the required fields.');
}
if (!filter_var($fields['Email'], FILTER_VALIDATE_EMAIL)) respond(400, 'Please enter a valid email address.');

$colours = ['Actor'=>0x5865F2, 'Trusted'=>0x57F287, 'Builder'=>0xFEE75C, 'Script Writer'=>0xEB459E];
$discordFields = [];
foreach ($fields as $name=>$value) {
    if (text_len($value) > 1024) $value = cut_text($value, 1018) . '…';
    $discordFields[] = ['name'=>$name, 'value'=>$value, 'inline'=>in_array($name, ['Minecraft Username','Discord','Age','Role'], true)];
}
$payload = [
    'username'=>'Mirage Applications',
    'embeds'=>[[
        'title'=>'📨 New Application — ' . $role,
        'description'=>'A new application has been submitted for review.',
        'color'=>$colours[$role] ?? 0x3498DB,
        'fields'=>array_slice($discordFields, 0, 25),
        'footer'=>['text'=>'Mirage Productions • Applications'],
        'timestamp'=>gmdate('c')
    ]],
    'allowed_mentions'=>['parse'=>[]]
];
$ch = curl_init($webhook);
curl_setopt_array($ch, [
    CURLOPT_POST=>true, CURLOPT_HTTPHEADER=>['Content-Type: application/json'],
    CURLOPT_POSTFIELDS=>json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
    CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>12
]);
$response = curl_exec($ch); $curlError = curl_error($ch); $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
if ($response === false || $status < 200 || $status >= 300) {
    error_log('Mirage applications: Discord webhook failed; HTTP ' . $status . '; ' . $curlError);
    respond(502, 'We could not deliver your application to the review team. Please try again or contact applications@miragesmp.org.');
}
// Preserve the applications inbox. The host must have PHP mail() configured.
$mailBody = '';
foreach ($fields as $name=>$value) $mailBody .= $name . ":\n" . $value . "\n\n";
$headers = "From: applications@miragesmp.org\r\n";
$headers .= 'Reply-To: ' . str_replace(["\r","\n"], '', $fields['Email']) . "\r\n";
if (!@mail('applications@miragesmp.org', 'Mirage Productions application — ' . $role, $mailBody, $headers)) {
    error_log('Mirage applications: Discord delivery succeeded, but PHP mail() failed.');
}
header('Location: /forms/thanks/', true, 303); exit;
