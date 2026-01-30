#  Trafic aérien mondial – Visualisation avec D3.js
##  Description

Ce projet est une **visualisation interactive du trafic aérien mondial**, réalisée dans le cadre du cours de DataViz.  
Il permet de visualiser les flux de vols entre aéroports, de filtrer les données et de comparer le trafic par pays et par aéroport via plusieurs diagrammes.

L’objectif est d’offrir une interface claire et intuitive pour comprendre les dynamiques du transport aérien à l’échelle mondiale.

page github : https://giougt.github.io/Data_viz_project/
##  Fonctionnalités principales

###  Carte interactive du monde
- Affichage des **pays**
- Affichage des **aéroports**
- Visualisation des **routes aériennes** entre aéroports

###  Filtrage
- Dropdown permettant de sélectionner un aéroport
- Mise en évidence :
  - des routes associées
  - de l’aéroport sélectionné

###  Diagrammes
- **Bar chart** : nombre total de vols par aéroport
- **Pie chart** : nombre de départs par pays

###  Interactions
- Tooltips sur :
  - les routes
  - les aéroports
  - les diagrammes

##  Technologies utilisées

- **D3.js v7** pour la visualisation
- **HTML5 / CSS3** pour la structure et le style
- **JavaScript** pour la logique et les interactions
- **JSON** pour le stockage des données :
  - `airports.json` : liste des aéroports
  - `flights.json` : flux de vols
  - `countries.geo.json` : géométrie des pays

##  Données

Les données proviennent de **OpenFlights (open data)** et ont été agrégées pour simplifier la visualisation.

- **airports.json** : code IATA, nom, pays, latitude, longitude  
- **flights.json** : nombre annuel de vols entre deux aéroports  
- **countries.geo.json** : géométrie des pays au format GeoJSON  

Seules les routes les plus significatives sont représentées afin de réduire la complexité visuelle.


