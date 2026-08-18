<?php
// backend/add_executive.php

require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

// Get raw JSON POST data
$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->full_name) &&
    !empty($data->linkedin_profile_url)
) {
    // Basic validation / sanitization
    $fullName = htmlspecialchars(strip_tags($data->full_name));
    $jobTitle = isset($data->job_title) ? htmlspecialchars(strip_tags($data->job_title)) : null;
    $companyName = isset($data->company_name) ? htmlspecialchars(strip_tags($data->company_name)) : null;
    $linkedinProfileUrl = htmlspecialchars(strip_tags($data->linkedin_profile_url));
    $companyLinkedinUrl = isset($data->company_linkedin_url) ? htmlspecialchars(strip_tags($data->company_linkedin_url)) : null;
    $sourceUrl = isset($data->source_url) ? htmlspecialchars(strip_tags($data->source_url)) : null;

    $query = "INSERT INTO executives 
                (full_name, job_title, company_name, linkedin_profile_url, company_linkedin_url, source_url) 
              VALUES 
                (:full_name, :job_title, :company_name, :linkedin_profile_url, :company_linkedin_url, :source_url)";

    $stmt = $db->prepare($query);

    $stmt->bindParam(":full_name", $fullName);
    $stmt->bindParam(":job_title", $jobTitle);
    $stmt->bindParam(":company_name", $companyName);
    $stmt->bindParam(":linkedin_profile_url", $linkedinProfileUrl);
    $stmt->bindParam(":company_linkedin_url", $companyLinkedinUrl);
    $stmt->bindParam(":source_url", $sourceUrl);

    try {
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Profile saved successfully"
            ]);
        }
    } catch (PDOException $e) {
        // MySQL error code 1062 is Duplicate entry for key
        if ($e->errorInfo[1] == 1062 || $e->getCode() == 23000) {
            echo json_encode([
                "success" => false,
                "duplicate" => true,
                "message" => "Profile already exists"
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Database Error: " . $e->getMessage()
            ]);
        }
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Incomplete data. Full name and LinkedIn profile URL are required."
    ]);
}
?>
