/*
	L'app doit enregistrer d'un cote les coordonnees des hopitaux, les afficher permanenment sur la carte
	declarer des accidents et emmettre des alertes
	
	bd:
	CREATE DATABASE HOSPMAPPING;
	CREATE TABLE hopital (
		id SERIAL PRIMARY KEY,
		nom VARCHAR(50),
		lat DOUBLE PRECISION,
		lon DOUBLE PRECISION
	);
	
	CREATE TABLE accident (
		id SERIAL PRIMARY KEY,
		lat DOUBLE PRECISION,
		lon DOUBLE PRECISION,
		date DATE
	);
	INSERT INTO hopital(nom,lat,lon) values('Hopital inconnu1','7.369722','12.354722');
	INSERT INTO hopital(nom,lat,lon) values('LosAngel Hospital', '34.05398', '-11.24532');
	Avantages:
	On sait exactement ou se trouve la les victimes
	les usagers savent exactement ou se trouve les hopitaux
	On recueille des donnees
*/
import './style.css';

import './src/Map.js'



