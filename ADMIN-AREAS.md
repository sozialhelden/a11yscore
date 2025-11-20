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

* allowedAdminAreas ersetzen durch neue 
* aufräumen
* openApi docs anpassen (response types)

* alten test für encode/decode umziehen

* wikidata id benutzen um das bild zu holen (im backend statt frontend)
* eventuell: job bauen der die bilder holt und in die db schreibt
* oder: als teil des admin areas sync die bild-urls holen
