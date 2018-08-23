 

# NIFify


Textual entities have been of great interest to researchers in Computer Science. Several large-scale projects are a valuable source of real-world entities suach as [Wikipedia](https://www.wikipedia.org/), [DBpedia](http://wiki.dbpedia.org/), [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page) and [BabelNet](http://babelnet.org/); and the association of entities to these knowledge bases constitutes a process of de-empathy, which has gained the attention of the community. There are several formats to these documents and annotations, but all of them, the [NIF](http://persistence.uni-leipzig.org/nlp2rdf/) format is mostly adopted.

The NIF format is based on triple RDF, for each document, you can annotate its entities by specifying the position within the text for each sentence separately, the knowledge base entry, type of entity, and other related information. We develop this tool that allows us to create a single document annotations, and review a collection of more than one document. This code is runing in [https://users.dcc.uchile.cl/~hrosales/NIFify.html](https://users.dcc.uchile.cl/~hrosales/NIFify.html).


Installation
------------

This tool is developed in JavaScript, so you can run the application just by downloading it and opening the file NIFify.hml in a browser.


Acknowledgments
---------------

The development of this software is supported by  by CONICYT-PCHA/Doctorado Nacional/2016-21160017 and the Millennium Nucleus Center for Semantic Web Research under Grant NC120004.


## License

Copyright 2018  Henry Rosales-Méndez, Aidan Hogan and Barbara Poblete, 
Center for Semantic Web Research, DCC, University of Chile

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0


Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.

This project uses 3rd party tools. You can find the list of 3rd party tools including their authors and licenses [here](LICENSE-3RD-PARTY).

