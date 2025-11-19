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

* wir wollen aus der osm sync datenbank alle admin-areas, die wir brauchen, in eine tabelle in der app db schreiben
* die admin-areas bekommen eine eigene id und einen hash für die url

---

TODO

* admin-areas in die db schreiben/kippen
* aus dem temporären code einen sync job machen
* den endpunkt umschreiben, so dass er admin areas aus der db bekommt

* schema anpassen
* decode/encode code rüber
* test umziehen
* frontend generiert hash aus der osm id, decoded osmid aus der url 

backend:
// /a11yscore/v1/admin-areas/{id}/scores/latest
// -> {id} === id spalte in der admin-areas table ist
// -> {id} === osm:-61003
// TODO: hash aus der datenbank löschen und hash logik ins frontend umziehen

frontend:
* /scores/rjv0dd-berlin
* hash encoden und die osm-id nutzen, um die daten aus dem backend zu holen
* wir vergleichen den slug aus dem backend und den slug aus der url, falls ungleich redirecten wir
