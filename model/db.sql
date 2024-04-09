CREATE DATABASE IF NOT EXISTS `chess_pomme`;
USE `chess_pomme`;

CREATE TABLE IF NOT EXISTS `chess_game` (
    `id` SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `white_player` SMALLINT UNSIGNED,
    `black_player` SMALLINT UNSIGNED,
    `pgn` TEXT,
    `winner` ENUM('white', 'black', 'draw', 'still playing') NOT NULL,
    `date` TIMESTAMP DEFAULT NOW() NOT NULL,
    `status` ENUM('checkmate', 'timeout', 'resign', 'by quit', 'mutual agreement', 'unsificient material', 'unsificient material and timeout')
);