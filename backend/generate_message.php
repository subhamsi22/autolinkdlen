<?php
require_once 'db.php';
require_once 'messaging_helpers.php';

$database = new Database();
$db = $database->getConnection();
ensureMessagingTables($db);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$leadId = filter_var($data['lead_id'] ?? null, FILTER_VALIDATE_INT);
if (!$leadId) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'A lead is required.']);
    exit;
}

$leadStmt = $db->prepare('SELECT * FROM executives WHERE id = :id');
$leadStmt->execute([':id' => $leadId]);
$lead = $leadStmt->fetch(PDO::FETCH_ASSOC);
if (!$lead) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Lead not found.']);
    exit;
}

$settingRows = $db->query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('grok_api_key', 'sales_niche', 'grok_model', 'ai_provider', 'ai_endpoint')")
    ->fetchAll(PDO::FETCH_KEY_PAIR);
$apiKey = $settingRows['grok_api_key'] ?? '';
$niche = trim($settingRows['sales_niche'] ?? '');
$model = trim($settingRows['grok_model'] ?? 'grok-4.6');
$provider = $settingRows['ai_provider'] ?? 'grok';
$customEndpoint = trim($settingRows['ai_endpoint'] ?? '');
if (!$niche || (in_array($provider, ['grok', 'gemini'], true) && !$apiKey)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Save your API key (if required) and sales niche first.']);
    exit;
}

$endpoints = [
    'grok' => 'https://api.x.ai/v1/chat/completions',
    'gemini' => 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'custom' => $customEndpoint
];
$endpoint = $endpoints[$provider] ?? '';
if (!$endpoint) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Save a valid AI provider endpoint first.']);
    exit;
}

$profile = "Name: {$lead['full_name']}\nTitle: " . ($lead['job_title'] ?: 'Not available') . "\nCompany: " . ($lead['company_name'] ?: 'Not available');
$payload = [
    'model' => $model,
    'messages' => [
        ['role' => 'system', 'content' => 'You write concise, human LinkedIn outreach drafts. Never claim facts not supplied. Do not use hype, pressure, emojis, or a subject line. Return only the message body. Keep it under 550 characters. End with a low-pressure question.'],
        ['role' => 'user', 'content' => "What I sell / my niche:\n{$niche}\n\nLead profile:\n{$profile}\n\nWrite one personalised first message."]
    ],
    'temperature' => 0.7,
    'max_tokens' => 220
];

$headers = ['Content-Type: application/json'];
if ($apiKey !== '') $headers[] = 'Authorization: Bearer ' . $apiKey;
$curl = curl_init($endpoint);
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_HTTPHEADER => $headers
]);
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_error($curl);
curl_close($curl);
$result = json_decode($response ?: '', true);
$message = trim($result['choices'][0]['message']['content'] ?? '');
if ($status < 200 || $status >= 300 || !$message) {
    http_response_code(502);
    $detail = $result['error']['message'] ?? $curlError ?: 'The AI server did not return a chat message.';
    echo json_encode(['success' => false, 'message' => 'AI request failed: ' . $detail]);
    exit;
}

$update = $db->prepare('UPDATE executives SET message_draft = :message WHERE id = :id');
$update->execute([':message' => $message, ':id' => $leadId]);
echo json_encode(['success' => true, 'message' => $message]);
