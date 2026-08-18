<?php
// backend/delete_executive.php

require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$id = isset($_GET['id']) ? $_GET['id'] : die(json_encode(["success" => false, "message" => "ID not provided"]));

$query = "DELETE FROM executives WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $id);

try {
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Executive deleted successfully"
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "No record found with that ID"
            ]);
        }
    }
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>
