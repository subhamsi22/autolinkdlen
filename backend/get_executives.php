<?php
// backend/get_executives.php

require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM executives ORDER BY created_at DESC";
$stmt = $db->prepare($query);

try {
    $stmt->execute();
    $num = $stmt->rowCount();
    $executives_arr = array();

    if ($num > 0) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $executives_arr[] = $row;
        }
    }
    
    echo json_encode([
        "success" => true,
        "data" => $executives_arr
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage(),
        "data" => []
    ]);
}
?>
