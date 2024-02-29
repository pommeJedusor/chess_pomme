# fonctionnement

## chess_html
regroupe les fonctions basique pour intéragir avec le DOM

## chess_ws
se connecte au serveur, analyse les requêtes de ce dernier et lance des fonctions du fichier chess_ws_html pour intéragir avec le DOM

## chess_ws_html
regroupe les fonctions qui permettent à la ws d'intéragir avec le DOM

## chessboard
écoute les évenements du DOM et réagis en conséquence (animation, envoi de données par ws, etc...)

## chessboard_html
regroupe les fonctions qui permettent aux fonctions chessboard d'intéragir avec le DOM