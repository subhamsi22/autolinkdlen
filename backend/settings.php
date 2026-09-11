<?php
require_once 'db.php';
require_once 'messaging_helpers.php';

$database = new Database();
$db = $database->getConnection();
ensureMessagingTables($db);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = $db->query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('grok_api_key', 'sales_niche', 'grok_model', 'ai_provider', 'ai_endpoint')")
        ->fetchAll(PDO::FETCH_KEY_PAIR);
    echo json_encode([
        'success' => true,
        'has_api_key' => !empty($rows['grok_api_key']),
        'sales_niche' => $rows['sales_niche'] ?? '',
        'grok_model' => $rows['grok_model'] ?? 'grok-4.6',
        'ai_provider' => $rows['ai_provider'] ?? 'grok',
        'ai_endpoint' => $rows['ai_endpoint'] ?? ''
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$niche = trim((string)($data['sales_niche'] ?? ''));
$model = trim((string)($data['grok_model'] ?? 'grok-4.6'));
$apiKey = trim((string)($data['grok_api_key'] ?? ''));
$provider = trim((string)($data['ai_provider'] ?? 'grok'));
$endpoint = trim((string)($data['ai_endpoint'] ?? ''));

if (!in_array($provider, ['grok', 'gemini', 'custom'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Choose a supported AI provider.']);
    exit;
}
if ($provider === 'custom' && (!filter_var($endpoint, FILTER_VALIDATE_URL) || !in_array(parse_url($endpoint, PHP_URL_SCHEME), ['http', 'https'], true))) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Enter a valid custom chat-completions URL.']);
    exit;
}
if ($provider === 'custom') {
    // Accept a server address such as http://192.168.29.22 as well as a full
    // OpenAI-compatible endpoint. Most local servers expose this route.
    $endpoint = rtrim($endpoint, '/');
    if (!str_ends_with($endpoint, '/chat/completions')) {
        $endpoint .= str_ends_with($endpoint, '/v1') ? '/chat/completions' : '/v1/chat/completions';
    }
}
if (strlen($niche) > 4000 || strlen($model) > 100 || strlen($apiKey) > 1000 || strlen($endpoint) > 1000) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'One of the settings is too long.']);
    exit;
}

$settings = ['sales_niche' => $niche, 'grok_model' => $model, 'ai_provider' => $provider, 'ai_endpoint' => $endpoint];
if ($apiKey !== '') $settings['grok_api_key'] = $apiKey;
$stmt = $db->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (:key, :value)
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
foreach ($settings as $key => $value) $stmt->execute([':key' => $key, ':value' => $value]);

echo json_encode(['success' => true, 'has_api_key' => $apiKey !== '' || !empty($db->query("SELECT setting_value FROM app_settings WHERE setting_key = 'grok_api_key'")->fetchColumn())]);
