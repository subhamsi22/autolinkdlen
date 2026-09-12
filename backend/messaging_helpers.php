<?php
function ensureMessagingTables(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS app_settings (
        setting_key varchar(100) NOT NULL PRIMARY KEY,
        setting_value text NULL,
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    try {
        $db->exec("ALTER TABLE executives ADD COLUMN message_draft text NULL AFTER source_url");
    } catch (PDOException $e) {
        // The column already exists on upgraded installations.
    }
}
