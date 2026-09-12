-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 18, 2026 at 06:38 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `linkedin_leads`
--

-- --------------------------------------------------------

--
-- Table structure for table `executives`
--

CREATE TABLE `executives` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `linkedin_profile_url` varchar(500) NOT NULL,
  `company_linkedin_url` varchar(500) DEFAULT NULL,
  `source_url` varchar(500) DEFAULT NULL,
  `message_draft` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Local settings for the outreach dashboard. The Grok key is intentionally
-- omitted from this sample export; save it through the dashboard after import.
CREATE TABLE `app_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `executives`
--

INSERT INTO `executives` (`id`, `full_name`, `job_title`, `company_name`, `linkedin_profile_url`, `company_linkedin_url`, `source_url`, `created_at`, `updated_at`) VALUES
(1, 'Unknown', '', '', 'https://www.linkedin.com/in/hrithik-kaura-2b1a60168/', NULL, 'https://www.linkedin.com/in/hrithik-kaura-2b1a60168/', '2026-08-09 12:49:33', '2026-08-09 12:49:33'),
(2, '(41) Rupak Barua', '', '', 'https://www.linkedin.com/in/rupak-barua-a57b1647/', NULL, 'https://www.linkedin.com/in/rupak-barua-a57b1647/', '2026-08-15 18:22:18', '2026-08-15 18:22:18'),
(4, '(41) Binita Sarkar', '', '', 'https://www.linkedin.com/in/binita-sarkar-801a557/', NULL, 'https://www.linkedin.com/in/binita-sarkar-801a557/', '2026-08-15 18:22:33', '2026-08-15 18:22:33'),
(5, '(41) Avik Roy', '', '', 'https://www.linkedin.com/in/avik-roy-7771604/', NULL, 'https://www.linkedin.com/in/avik-roy-7771604/', '2026-08-15 18:22:53', '2026-08-15 18:22:53'),
(7, '(41) Sujay Santra', '', 'iKure Techsoft Pvt. Ltd.', 'https://www.linkedin.com/in/sujay-santra-ikure/', 'https://www.linkedin.com/company/ikuretech/', 'https://www.linkedin.com/in/sujay-santra-ikure/', '2026-08-15 18:23:10', '2026-08-15 18:23:10'),
(8, '(41) Arun Pattatheyil', '', '', 'https://www.linkedin.com/in/arun-pattatheyil-516244b/', NULL, 'https://www.linkedin.com/in/arun-pattatheyil-516244b/', '2026-08-15 18:23:24', '2026-08-15 18:23:24'),
(10, '(41) Sujoy Biswas', '', 'Futurepreneurs', 'https://www.linkedin.com/in/sujoy-biswas-ab1a874/', 'https://www.linkedin.com/company/ecelltiu/', 'https://www.linkedin.com/in/sujoy-biswas-ab1a874/', '2026-08-15 18:24:09', '2026-08-15 18:24:09'),
(11, '(41) Ritu Mittal', '', '', 'https://www.linkedin.com/in/ritu-mittal-a108b5213/', NULL, 'https://www.linkedin.com/in/ritu-mittal-a108b5213/', '2026-08-15 18:24:23', '2026-08-15 18:24:23'),
(13, '(41) Atul Gupta', '', '', 'https://www.linkedin.com/in/atulstays/', 'https://www.linkedin.com/company/tie-kolkataofficial/posts/', 'https://www.linkedin.com/in/atulstays/', '2026-08-15 18:24:45', '2026-08-15 18:24:45'),
(16, '(41) Arunabha Ghosh', '', '', 'https://www.linkedin.com/in/argindia/', 'https://www.linkedin.com/company/blue-copper-technologies/posts/', 'https://www.linkedin.com/in/argindia/', '2026-08-15 18:25:00', '2026-08-15 18:25:00'),
(18, 'Search Results', '', '', 'https://www.google.com/search', NULL, 'https://www.google.com/search?q=site:linkedin.com/in/+%22CEO%22+%22Kolkata%22&amp;sca_esv=833cca28328ef153&amp;sxsrf=APpeQnuWpY7yNgUu12-evSbya3zs8nwZHw:1786818119631&amp;ei=R66AapSPJsKy4-EPuMmvoQw&amp;start=10&amp;sa=N&amp;sstk=AS6-VmL3ZwyKPtN_OWdgFgtmDo4o_jIca1TzgSZK7KgijfO2G0ATJu1Htaqr86ferC9qg1MI2cN8FDYyVviHuz-Or5P6Zco80S6OJw&amp;ved=2ahUKEwjUzrGaoKOWAxVC2TgGHbjkK8QQ8NMDegQIJBAW', '2026-08-15 18:25:15', '2026-08-15 18:25:15'),
(35, 'https://www.google.com/search?q=site:linkedin.com/in/+%22CEO%22+%22Kolkata%22&amp;sca_esv=833cca28328ef153&amp;sxsrf=APpeQnuWpY7yNgUu12', 'evSbya3zs8nwZHw:1786818119631&amp;ei=R66AapSPJsKy4', 'EPuMmvoQw&amp;start=10&amp;sa=N&amp;sstk=AS6', 'https://www.google.com/sorry/index', NULL, 'https://www.google.com/sorry/index?continue=https://www.google.com/search%3Fq%3Dsite:linkedin.com/in/%2B%2522CEO%2522%2B%2522Kolkata%2522%26sca_esv%3D833cca28328ef153%26sxsrf%3DAPpeQnuWpY7yNgUu12-evSbya3zs8nwZHw:1786818119631%26ei%3DR66AapSPJsKy4-EPuMmvoQw%26start%3D10%26sa%3DN%26sstk%3DAS6-VmL3ZwyKPtN_OWdgFgtmDo4o_jIca1TzgSZK7KgijfO2G0ATJu1Htaqr86ferC9qg1MI2cN8FDYyVviHuz-Or5P6Zco80S6OJw%26ved%3D2ahUKEwjUzrGaoKOWAxVC2TgGHbjkK8QQ8NMDegQIJBAW&amp;q=EhAkBQIBkAIqNdQFOFZu0GK1GMXfgtQGIjDmsGB6B7RcLV8-W', '2026-08-15 18:28:35', '2026-08-15 18:28:35');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `executives`
--
ALTER TABLE `executives`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `linkedin_profile_url` (`linkedin_profile_url`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `executives`
--
ALTER TABLE `executives`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
