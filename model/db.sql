CREATE DATABASE IF NOT EXISTS `chess_pomme`;
USE `chess_pomme`;

CREATE TABLE IF NOT EXISTS `chess_game` (
    `id` SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `white_player` SMALLINT UNSIGNED,
    `black_player` SMALLINT UNSIGNED,
    `pgn` TEXT,
    `winner` ENUM('white', 'black', 'draw', 'still playing') NOT NULL,
    `date` TIMESTAMP DEFAULT NOW() NOT NULL,
    `status` ENUM('checkmate', "stalemate", 'timeout', 'resign', 'by quit', 'mutual agreement', 'unsificient material', 'unsificient material and timeout')
);

CREATE TABLE IF NOT EXISTS `user` (
    `id` SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `username` VARCHAR(30) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `auth_cookie` (
    `id` SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `user_id` SMALLINT UNSIGNED NOT NULL,
    `cookie` VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);