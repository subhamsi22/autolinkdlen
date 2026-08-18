<?php
// backend/count_executives.php

require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT COUNT(*) as total FROM executives";
$stmt = $db->prepare($query);

try {
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "total" => $row['total']
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage(),
        "total" => 0
    ]);
}
?>
