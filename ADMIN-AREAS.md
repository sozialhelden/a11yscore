Requirements

* Erstmal nur Deutschland
* Wir wollen
  * Bundesländer -> 4
  * Regierungsbezirke -> 5
  * Landkreise -> 6
  * Siehe: https://wiki.openstreetmap.org/wiki/Tag%3aboundary=administrative#Country_specific_values_%E2%80%8B%E2%80%8Bof_the_key_admin_level=*
* Wir wollen URLs like /scores/a6ho9d-berlin, also mit hashid und einem namen
  * /scores/a6ho9d-asdf soll auch funktionieren und auf /scores/a6ho9d-berlin weiterleiten
  * /scores/osm/-61723 soll auch funktionieren und auf /scores/a6ho9d-berlin weiterleiten
* api bauen /admin-areas, die alle admin-areas zurückgibt

----

Herangehensweise

* wir erstellen eine eigene admin-areas tabelle in der app-db, in die wir die admin-areas reinkippen
* wir erstellen ein sync-script für die admin-areas
