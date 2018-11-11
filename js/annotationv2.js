$(document).ready(function() {
    
    D = []; // Documentos    {uri:"http://example.org/Doc1" "inDocCounter":1}
    A = []; // Arreglo que va a tener las annotaciones, de la forma {"ini":1, "fin":3, "idA":1,  "uri":["http://example.org/enriry1","http://example.org/enriry2"], "tag":["ex:type1", ..], "id_sentence":1  "uridoc":"http://aaaa.doc1"}
    Sentences = []; // Lista de oraciones del documento   {text:"..."  uridoc:"http://example.org/Doc1"}
    n = 0; // tamaño del texto
    ///////idSentence2dicc = {}; // tiene por cada oración el uri correspondiente
    temp_annotation = {};
    inDocCounter = 1;
    dicc_uri2inDocCounter = {}
    link2type = {}; // va a guardar el tipo de mención de cada enlace ej, {"https://en.wikipedia.org/wiki/Michael_Jackson":"mnt:Person"}
    _filter = []; // List Of Filter that you want apply

    warning_alert = function(text){
        BootstrapDialog.show({
            title: 'Information',
            message: text,
            buttons: [ {
                label: 'Ok',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
    }


    isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    replaceAll = function(str, term, replacement){
            //console.log("-->"+str+"|"+term+"|"+replacement);
            return str.replace(new RegExp(term, 'g'), replacement);
    }

    
    /*function Sentences2ArrayString(){
        var S = [];
        for (i in Sentences){
            sent = Sentences[i]["text"];
            S.push(sent);
        }
        return S;
    }*/
    
    function CleanAnnotationDocument() {
        //for (i in Sentences){
            D.splice(0,D.length);
            Sentences.splice(0,Sentences.length);
            A.splice(0,A.length)
            $("#nifdoc").html("");
            $("#sentencesDoc").html("");
            $(".parent_div_show").remove();
            inDocCounter = 1;
        //}
    }


    
    splitBySentences = function(input_text){
        var text = input_text;
         //var res = replaceAll(text,/\s\s+/i, ' ');
         //#res = replaceAll(res,/\.[^0123456789]/i, "\.\n");
         var res = "";
         var len = text.length;
         var anterior = 'a';
         var state = 0;
         for (var i = 0; i < len; i++) {
             if (state == 0){  // anterior normal
                 if (text[i] == '.'){
                    //alert("1");
                    /*if (anterior == anterior.toUpperCase()){
                        res = res + ".";
                        console.log("a -->"+res);
                    }
                    else */
                    if (i != len && (text[i+1]>='0' && text[i+1]<='9') ){ // si el siguiente es un número
                        res = res + ".";
                        //console.log("b ->" + res);
                    }
                    else{
                        res = res + ".\n";
                        //console.log("c -->" + res);
                    }
                 }
                 else if (text[i] == " " || text[i] == "\t" || text[i] == "\n"){  // si es un espacio no lo pongo, para eliminar espacios en blanco repetidos etc
                     state = 1;
                     //console.log("d -->" + res);
                 }
                 else{
                     res = res + text[i];
                     //console.log("e -->" + res);
                 }
             }
             else if (state == 1){ //anterior un espacio, cambio de línea o tabulador que no puse, toca ponerlo
                 //alert("2");
                 if (text[i] == " " || text[i] == "\t" || text[i] == "\n"){
                    //nada
                    //console.log("2-a -->" + res );
                 }
                 else if (text[i] == '.'){
                    res = res + ".\n"; 
                    state = 0;
                    //console.log("2-b -->" + res);
                 }
                 else {
                    if (res[res.length - 1] == "\n"){  // porque sino las oraciones empiezan con un espacio al inicio
                        res = res + text[i];
                    }
                    else {
                        res = res + " "+text[i];
                    }
                    state = 0;
                    //console.log("2-c -->" + res);
                 }
                
             }
             anterior = text[i];
         }
         return res;
    }

    $("#btn_1_split").click(function(){
        var inText = $("#inDoc").val();
        var _res = splitBySentences(inText); 
        $("#inDoc").val(_res);
    });

    $("#btn_2_acept_sent").click(function(){
        $("#divShow").removeClass("hide");

 
        /////$("#inDoc").prop("readonly",true);
        //$("#inIdDoc").prop("readonly",true);

        //////$(this).prop( "disabled", true ); //Disable
        //////$("#btn_1_split").prop( "disabled", true ); //Disable
        //////$("#btn_3_annotation").prop( "disabled", false ); //Enable
        //////$("#btn_4_annotation").prop( "disabled", false ); //Enable
        
        CreateSentenceList(); // creo la lista de oraciones
        buildNIFCorpora(); // actualizo los div de visualizar (anotaciones en texto plano y NIF)
    });

    // Esta función busca a que id de sentencia pertenece esa posicion
    sent2id = function(pos,inDocCounter){
        var overall = 0;
        var urldoc = "";
        
        // find first the document with inDocCounter
        for (d in D){
            doc = D[d];
            if (doc["inDocCounter"] == inDocCounter){
                urldoc = doc["uri"];
                break;
            }
        }
        
        //I find only in the Sentences that belong to the specified document
        for (i in Sentences){
            if (Sentences[i]["uridoc"]!=urldoc){
                continue;
            }
            sent = Sentences[i]["text"];
            overall = overall + sent.length+1;
            if (pos < overall){
                return i;
            }
        }
    }


    // Miro si hay solapamiento (conflicto) con algunas de las annotaciones existentes
    existsOverlapping = function(ann){
        ini = ann["ini"];
        fin = ann["fin"];
        for (i in A){
            a = A[i]
            if (ann["uridoc"]!=a["uridoc"]){continue;}
            //if ( (a["ini"] <= ini  && ini <= a["fin"]) ||  (a["ini"] <= fin  && fin <= a["fin"])){return true;}
            if (!(    ( (a["ini"]<ini && a["ini"]<fin) && (a["fin"]<ini && a["fin"]<fin) )   ||   ( (ini<a["ini"] && ini<a["fin"]) && (fin<a["ini"] && fin<a["fin"]) )  )){
                return true;
            }
            //if (!(a["fin"]<ini && fin<a["ini"])){
            //    
            //}
            
        }
        return false;
    }
    
    // Miro si ya existe esa misma anotacion
    ItIsRepetition = function(ann){
        ini = ann["ini"];
        fin = ann["fin"];
        for (i in A){
            a = A[i];
            if (ann["uridoc"]!=a["uridoc"]){
                continue;
            }
            if (a["ini"]==ini && a["fin"]==fin){
                return true;
            }
        }
        return false;
    }

    // Cuando doy click en el boton de annotar -- preparando la modal para  mostrar
    //////$("#btn_3_annotation").click(function(){
    //$(".btn_annotation").click(function(){
    $(document).on('click', '.btn_annotation', function () {
        remove_input_uris();
        var inDocCounter = $(this).attr("inDocCounter");

        var txtArea = document.getElementById("inDoc"+inDocCounter);
        var selectedText;   
        var startPosition;
        var endPosition;
        if (txtArea.selectionStart == txtArea.selectionEnd){
             warning_alert("You should select one entity mention");		    
            return 0;
        }
        //alert(txtArea.selectionStart.toString()+" - "+txtArea.selectionEnd.toString());
        if (txtArea.selectionStart != undefined) {    
            startPosition = txtArea.selectionStart;
            endPosition = txtArea.selectionEnd;
            selectedText = txtArea.value.substring(startPosition, endPosition);
        } else{
            warning_alert("You should select one entity mention - undefined position");
            return 0; 
        }
        var ids = sent2id(startPosition,inDocCounter);
        temp_annotation = {   // esta variable global la voy a completar cuando  llene el URI y a taxonomia en el modal
             "ini":startPosition,
             "fin":endPosition,
             "id_sentence":ids,
             "uridoc":Sentences[ids]["uridoc"],
             "label":selectedText
        };
        //Deselecciono
        txtArea.selectionStart = 0;
        txtArea.selectionEnd = 0;
        /////////$("#inDoc"+inDocCounter).focus();


        

        var dif = 20;
        var label_show =  selectedText; // Esta variable se mostrar en el header de la modal
        if (startPosition - dif > 0 &&  endPosition + dif < n){
            label_show = "...<i>"+txtArea.value.substring(startPosition-dif, startPosition) + 
                         "</i><b>"+selectedText+"</b><i>"+
                         txtArea.value.substring(endPosition, endPosition+dif)+"</i>...";
        }
        
        if (existsOverlapping(temp_annotation)){
            if (ItIsRepetition(temp_annotation)){
                warning_alert("This mention is already annotated.");
                return 0; 
            }
            label_show = label_show + "<p class=\"text-danger\">This entity is overlapped with other mention.</p>";
        }
        
        nselect = selectedText.length;
        if (selectedText[0] == " " || selectedText[0] == "\n" || selectedText[0] == "\t" || selectedText[nselect-1] == " " || selectedText[nselect-1] == "\n" || selectedText[nselect-1] == "\t"){
            label_show = label_show + "<p class=\"text-danger\">The first/last character must not belong to the surface form, you must to close this annotation and select the correct surface form.</p>";
        }

        $("#myModal-title-desc").html(label_show);
        var listTaxonomy = undefined;
        //var inputTaxonomy = $("#taxonomyInput").val();
        var listInputTaxonomy = $("#taxonomyInput").select2('data'); //devuelve algo asi [{…}, {…}]
                                                                 //                   0: {id: 2, text: "nerd:Airline"},
                                                                 //                   1: {id: "ddd", text: "ddd"}

        /*var taxonomy = []; // el select2 version 4 permite entrar valores, pero esos se toman como string, 
                                     // y los otros iniciales como el numero identificador del string.. así que aqui llevo los id a valores
        $("#modalSelectTaxonomy").empty();
        select = document.getElementById('modalSelectTaxonomy');
        if (listInputTaxonomy.length != 0){
            for (i in listInputTaxonomy){
                v = listInputTaxonomy[i];
                option = document.createElement('option');
                option.value = i;
                option.text = v["text"];
                select.add(option);
            }
            //console.log(listTaxonomy);
  
        } */
        
        $("#btn_type_modalSelectURI").html("- Select Type -");
        $("#modalSelectURI").attr("mentiontype","- Select Type -");


        $("#modalSelectURI").val("");
        $("#commentAnn").val("");
        $('#taxonomyAnn').val('').trigger("change");
        //----> document.getElementById('modalSelectTaxonomy').selectedIndex = -1;
        $('#myModal').modal("show");
        $('#myModal').on('shown.bs.modal', function () {
            $("#modalSelectURI").focus();
        });
    });


    //---------- Annotate Button -------------------------
    remove_input_uris = function(){
      $('.taIdentRefContainer').each(function() {
          $(this).remove();
      });
    }

    $("#btn_annotate").click(function(){ 
        /*var in_uri = $("#modalSelectURI").val();
        if (!in_uri){
            warning_alert("Debe de entrar una URI");
            return 0;
        }
        else {*/
            //
            // get the list of uris added
            var list_uri = [];
            $('.taIdentRef').each(function() {
                var text = $(this).val();
                if (text!=""){
                    list_uri.push(text);
                }
                
                // -- added
                console.log("---------------------------------\n",text);
                //if (link2type[text] == undefined){
                    var typeMention = $(this).attr("mentiontype");
                    //console.log("typeMention -->",typeMention)
                    if (typeMention != '- Select Type -'){
                        link2type[text] = w2type[typeMention];
                        //console.log(text,"----->",typeMention);
                    }
                //}
            });

            // OJOOOO
            var in_uri = $("#modalSelectURI").val();
            if (in_uri){
                list_uri.push(in_uri);
                var typeMention = $("#modalSelectURI").attr("mentiontype");
                if (typeMention != '- Select Type -'){
                    link2type[in_uri] = w2type[typeMention];
                    //console.log("in_uri:",in_uri,"   w2type[typeMention]:",w2type[typeMention],"    typeMention:",typeMention);
                }
            }
            
            
               
            if (list_uri.length == 0){
                warning_alert("Debe de entrar una URI");
                return 0;
            }
            
            temp_annotation["uri"] = list_uri;
            
            
            /*if ($("#modalSelectTaxonomy").val()){
                //console.log(' $("#modalSelectTaxonomy").text():', $("#modalSelectTaxonomy").text());
                var listInputTaxonomy = $("#taxonomyInput").select2('data');
                var tag_text = listInputTaxonomy[$("#modalSelectTaxonomy").val()]["text"];
                //console.log("******>>>"+tag_text);
                temp_annotation["tag"] = tag_text;//$("#modalSelectTaxonomy").text();
            }*/
            var list_tag = [];
            var listInputTaxonomy = $("#taxonomyAnn").select2('data');        
            if (listInputTaxonomy.length != 0){
                for (i in listInputTaxonomy){
                    var v = listInputTaxonomy[i];
                    list_tag.push(v["text"])
                }
                temp_annotation["tag"] = list_tag;
            }
            
            // comment
            var comment = $("#commentAnn").val();
            if (comment != undefined && comment.length>0){
                temp_annotation["comment"] = comment;
            }            
            
            
        //}
        temp_annotation["idA"] = A.length;
        temp_annotation["uridoc"] = Sentences[temp_annotation["id_sentence"]]["uridoc"];
        A.push(temp_annotation);
       $('#myModal').modal("hide"); 
       buildNIFCorpora();
       remove_input_uris();
    });




    uridoc2id = function(A,uridoc){
        for (d in A){
            doc = A[d];
            if (doc["uri"] == uridoc){
                var _inDocCounter = doc["inDocCounter"];
                return _inDocCounter;
            }
        }
        return -1;
    }
    
    
    urisent2id = function(A,uris){
        for (a_i in A){
            a = A[a_i];
            if (a["id_sent"] == uris){
                return a_i;
            }            
        }
        return -1;
    }


    id2text = function(_inDocCounter){
        var text = $("#inDoc"+_inDocCounter).val();
        return text;
    }
    
    
    changeAntecedentCorr = function(temp_tags,flag){
        if (temp_tags == undefined){return [];}
        var tags = [];
        for (h in temp_tags){
            t = temp_tags[h];
            if (t == "mnt:AntecedentRf" && flag == false){
                tags.push("mnt:CoreferenceRf");
            }
            else if (t == "mnt:CoreferenceRf" && flag == true){
                tags.push("mnt:AntecedentRf");
            }
            else{
                tags.push(t);
            }
        }
        return tags;
    }


    $("#btn_annotate_this_doc").click(function(){ 
        var list_uri = [];
        $('.taIdentRef').each(function() {
            var text = $(this).val();
            if (text!=""){
                list_uri.push(text);
            }
            
            var typeMention = $(this).attr("mentiontype");
            console.log("typeMention -->",typeMention)
            if (typeMention != '- Select Type -'){
                link2type[text] = w2type[typeMention];
            }
            
        });

        var in_uri = $("#modalSelectURI").val();
        if (in_uri){
            list_uri.push(in_uri);
            
            var typeMention = $("#modalSelectURI").attr("mentiontype");
            if (typeMention != '- Select Type -'){
                link2type[in_uri] = w2type[typeMention];
            }
        }
           
        if (list_uri.length == 0){
            warning_alert("Debe de entrar una URI");
            return 0;
        }
        
        temp_annotation["uri"] = list_uri;
        
        
        /*if ($("#modalSelectTaxonomy").val()){
            //console.log(' $("#modalSelectTaxonomy").text():', $("#modalSelectTaxonomy").text());
            var listInputTaxonomy = $("#taxonomyInput").select2('data');
            var tag_text = listInputTaxonomy[$("#modalSelectTaxonomy").val()]["text"];
            //console.log("******>>>"+tag_text);
            temp_annotation["tag"] = tag_text;//$("#modalSelectTaxonomy").text();
        }*/
        
        var list_tag = [];
        var listInputTaxonomy = $("#taxonomyAnn").select2('data');        
        console.log("#####listInputTaxonomy-->",listInputTaxonomy);
        console.log("#####temp_annotation:::",temp_annotation);
        if (listInputTaxonomy.length != 0){
            console.log("## entre");
            for (i in listInputTaxonomy){
                var v = listInputTaxonomy[i];
                list_tag.push(v["text"])
            }
            temp_annotation["tag"] = list_tag;
            console.log("#### tag:",list_tag);
        }
        
        
        var comment = $("#commentAnn").val();
        if (comment != undefined && comment.length>0){
            temp_annotation["comment"] = comment;
        }  
            
        
        temp_annotation["idA"] = A.length;
        temp_annotation["uridoc"] = Sentences[temp_annotation["id_sentence"]]["uridoc"];
        //A.push(temp_annotation);
        $('#myModal').modal("hide");



        // seach the other mentions of this surface form
        var allow_overlaps = $("#cbox_overlaps").prop("checked");
        var t = temp_annotation["label"];
        var t_len = t.length;
        _inDocCounter = uridoc2id(D,temp_annotation["uridoc"]);
        var txt = id2text(_inDocCounter)
        var p = txt.indexOf(t);
        var overall = 0;
        var first_in_doc = true;
        while (p!=-1){
            var ini = overall + p;
            var fin = overall + p + t_len;
            //var posInA = notAnnotatedYet(ini,fin);
            var goahead = false;
            if (allow_overlaps){
                goahead = !ItIsRepetition({"ini":ini, "fin":fin, "uridoc":temp_annotation["uridoc"]});
                console.log("1");
                console.log(goahead);
            }
            else{
                goahead = !existsOverlapping({"ini":ini, "fin":fin, "uridoc":temp_annotation["uridoc"]});
                console.log("2");
                console.log(goahead);
            }

            if (goahead){
            //if (!existsOverlapping({"ini":ini, "fin":fin, "uridoc":})){
            //if (posInA == -1){ 
              if ( (p==0 || txt[p-1] in punctuationsSign) && (p+t_len==txt.length || txt[p+t_len] in punctuationsSign) ){
                  var ids = sent2id(ini,_inDocCounter);
                  
                  
                  var new_ann = {
                            "ini":ini, 
                            "fin":fin, 
                            "uri":list_uri, 
                            "id_sentence": ids,
                            "uridoc":temp_annotation["uridoc"],
                            "label":t,
                            "idA": A.length
                        };
                  
                  if ("tag" in temp_annotation && temp_annotation["tag"]!=undefined){ 
                     var tags = changeAntecedentCorr(temp_annotation["tag"],first_in_doc);
                     new_ann["tag"] = tags;
                  }
                  
                  if ("comment" in temp_annotation && temp_annotation["comment"]!=undefined){
                      new_ann["comment"] = temp_annotation["comment"];
                  }
                  
                  A.push(new_ann);
                  
                  first_in_doc = false;
                  console.log("))))))))))))");
                  console.log(first_in_doc);
              }

            }
            overall = fin;
            var temp_txt = txt.substr(p + t_len,txt.lenth);
            txt = temp_txt;
            p = txt.indexOf(t);
        }



        buildNIFCorpora();
        remove_input_uris();
    });
    
    
    



    $("#btn_annotate_all_doc").click(function(){ 
        var list_uri = [];
        $('.taIdentRef').each(function() {
            var text = $(this).val();
            if (text!=""){
                list_uri.push(text);
            }
            
            var typeMention = $(this).attr("mentiontype");
            console.log("typeMention -->",typeMention)
            if (typeMention != '- Select Type -'){
                link2type[text] = w2type[typeMention];
                console.log(text,"----->",typeMention);
            }
            
        });

        var in_uri = $("#modalSelectURI").val();
        if (in_uri){
            list_uri.push(in_uri);
            
            var typeMention = $("#modalSelectURI").attr("mentiontype");
            if (typeMention != '- Select Type -'){
                link2type[in_uri] = w2type[typeMention];
                console.log("in_uri:",in_uri,"   w2type[typeMention]:",w2type[typeMention],"    typeMention:",typeMention);
            }
        }
           
        if (list_uri.length == 0){
            warning_alert("Debe de entrar una URI");
            return 0;
        }
        
        temp_annotation["uri"] = list_uri;
        
        
        /*if ($("#modalSelectTaxonomy").val()){
            //console.log(' $("#modalSelectTaxonomy").text():', $("#modalSelectTaxonomy").text());
            var listInputTaxonomy = $("#taxonomyInput").select2('data');
            var tag_text = listInputTaxonomy[$("#modalSelectTaxonomy").val()]["text"];
            //console.log("******>>>"+tag_text);
            temp_annotation["tag"] = tag_text;//$("#modalSelectTaxonomy").text();
        }*/
        
        var list_tag = [];
        var listInputTaxonomy = $("#taxonomyAnn").select2('data');        
        if (listInputTaxonomy.length != 0){
            for (i in listInputTaxonomy){
                var v = listInputTaxonomy[i];
                list_tag.push(v["text"])
            }
            temp_annotation["tag"] = list_tag;
        }
        
        var comment = $("#commentAnn").val();
        if (comment != undefined && comment.length>0){
            temp_annotation["comment"] = comment;
        }  
        
        temp_annotation["idA"] = A.length;
        temp_annotation["uridoc"] = Sentences[temp_annotation["id_sentence"]]["uridoc"];
        //A.push(temp_annotation);
        $('#myModal').modal("hide");



        // seach the other mentions of this surface form
        var allow_overlaps = $("#cbox_overlaps").prop("checked");
        var t = temp_annotation["label"];
        var t_len = t.length;
        var first_in_doc = true;
        for (d in D){
            first_in_doc = true;
            doc = D[d];
            _inDocCounter = doc["inDocCounter"];
            var txt = id2text(_inDocCounter)
            var p = txt.indexOf(t);
            var overall = 0;
            while (p!=-1){
                var ini = overall + p;
                var fin = overall + p + t_len;
                //var posInA = notAnnotatedYet(ini,fin);
                var goahead = false;
                if (allow_overlaps){
                    goahead = !ItIsRepetition({"ini":ini, "fin":fin, "uridoc":doc["uri"]});
                    //console.log("1");
                    //console.log(goahead);
                }
                else{
                    goahead = !existsOverlapping({"ini":ini, "fin":fin, "uridoc":doc["uri"]});
                    //console.log("2");
                    //console.log(goahead);
                }

                if (goahead){
                //if (posInA == -1){ 
                  if ( (p==0 || txt[p-1] in punctuationsSign) && (p+t_len==txt.length || txt[p+t_len] in punctuationsSign) ){
                      var ids = sent2id(ini,_inDocCounter);
                      
                      var new_ann = {
                                "ini":ini, 
                                "fin":fin, 
                                "uri":list_uri, 
                                "id_sentence": ids,
                                "uridoc":doc["uri"],
                                //"uridoc": Sentences[ids]["uridoc"],
                                "label":t,
                                "idA": A.length
                            }
                      
                      if ("tag" in temp_annotation && temp_annotation["tag"]!=undefined){
                          var tags = changeAntecedentCorr(temp_annotation["tag"],first_in_doc);
                          new_ann["tag"] = tags;
                      }
                      
                      if ("comment" in temp_annotation && temp_annotation["comment"]!=undefined){
                          new_ann["comment"] = temp_annotation["comment"];
                      }

                      A.push(new_ann);
                      first_in_doc = false;
                  }

                }
                overall = fin;
                var temp_txt = txt.substr(p + t_len,txt.lenth);
                txt = temp_txt;
                p = txt.indexOf(t);
            }
        }



        buildNIFCorpora();
        remove_input_uris();
    });


    //---------- select del div
    /*
    if (!window.x) {
		x = {};
	}

	x.Selector = {};
	x.Selector.getSelected = function() {
		var t = '';
		if (window.getSelection) {
		    t = window.getSelection();
		} else if (document.getSelection) {
		    t = document.getSelection();
		} else if (document.selection) {
		    t = document.selection.createRange().text;
		}
		return t;
	}

	$(document).ready(function() {
		$(document).bind("mouseup", function() {
		    var mytext = x.Selector.getSelected();
		    alert(mytext);
		});
	});*/


    //----------- construcción del corpus

    // Esta función crea la lista de Sentencias por unica vez, por cada documento
    CreateSentenceList = function(){
       var urldoc = $("#inIdDoc").val();
       if (!urldoc){
           //warning_alert("The corpora URI is empty");
           urldoc = "https://example.org/doc"+inDocCounter;
           $("#inIdDoc").addClass("has-error");
       }

       var text = $("#inDoc").val();
       S = text.split("\n");
       for (i in S){
           sent = S[i];
           Sentences.push({"text":sent, "uridoc":urldoc});
       }
       n = text.length;
       
       
       
       //preparo el proximo documento..   
       D.push({"uri":urldoc, "inDocCounter":inDocCounter})
       dicc_uri2inDocCounter[urldoc] = inDocCounter;
       inDocCounter = inDocCounter + 1;

    };
    
    // to launch the annotation modal window when the key 'a' will be pressed
    onkeyup_check = function(e){
      var charCode = (typeof e.which == "number")? e.which : e.keyCode;
      if (charCode == 65){
          console.log(";)");
          var _id = document.activeElement.id;
          console.log(_id);
          var _inDocCounter=_id.substring(5,_id.length);
          console.log(_inDocCounter);
          $("#btn_3_annotation"+_inDocCounter).click();
      }
    }


    // crea el NIF del documento: header y context
    buildContext = function(idd){

           doc = D[idd];
           var inDocCounter = doc["inDocCounter"];
           var urldoc = doc["uri"];
           

           //var text = $("#inDoc"+inDocCounter).val();
           text = "";
           for (i in Sentences){
               sent = Sentences[i];
               if (sent["uridoc"]==urldoc){
                   if (text == ""){
                       text = text + sent["text"];
                   } else{
                       text = text + "\n" + sent["text"];
                   }
               }
           }
           /////$("#inDoc"+inDocCounter).val(text);
           //$("#inDoc"+inDocCounter).html(text);
           
           
           var labels_html = '<span class="label label-info">#'+inDocCounter+'</span>';
           
           var _html = '<div class="row parent_div_show drop-shadow">'+
        '<div style="class="col-lg-12">'+
            '<div id="doc'+inDocCounter+'" class="row">'+                
                '<div class="col-lg-6">'+
                    '<div class="row">'+
                    //--
                        '<div id= "_labels'+inDocCounter+'" class="col-lg-12">'+labels_html+'<br>'+
                        '</div>'+
                    //--
                        '<div class="col-lg-12">'+
                            '<div class="input-group control-group">'+
                                '<input type="text" style="width:100%!important;height:35px;padding: 5px;" value="'+urldoc+'" id="urldoc"'+inDocCounter+'/>'+
                                '<div class="input-group-btn"> '+
                                    '<button id="modifyIdDoc" class="btn btn-secondary" type="button"><i class="glyphicon glyphicon-edit"></i> Modify</button>'+
                                '</div>'+
                            '</div>'+
                            '<textarea class="form-control textareaclass" onkeyup="onkeyup_check(event)" idc="'+inDocCounter+'" id="inDoc'+inDocCounter+'" rows="3" style="min-height:100px;height:100%;" placeholder="Enter the document in plain text" readonly>'+text+'</textarea>'+
                            '<button id="btn_3_annotation'+inDocCounter+'" inDocCounter="'+inDocCounter+'" type="button" class="btn btn-primary margin_buttons btn_annotation"> <i class="fa fa-hand-pointer-o fa-lg"></i> Annotate Entity</button>'+
                            '<button id="btn_deldoc'+inDocCounter+'" onclick="deletedoc('+inDocCounter+')" inDocCounter="'+inDocCounter+'" type="button" class="btn btn-primary margin_buttons btn_deldoc"> <i class="fa fa-remove fa-lg"></i> Delete Doc</button>'+
                        '</div>'+
                    //
                    '</div>'+
                '</div>'+
                '<div id="sentencesDoc'+inDocCounter+'" class="col-lg-6 noselect" style="min-height:100px;"> '+
                    '-- EMPTY -- '+
                '</div>'+
            '</div>'+
        '</div>'+
       '</div>';

       //$("#DisplayBlock").prepend(_html);
       $("#DisplayBlock").append(_html);
           
           
           
           
           
           text = replaceAll(text,"\n"," ");
           /*var urldoc = $("#inIdDoc").val();
           if (!urldoc){
               warning_alert("The corpora URI is empty");
               urldoc = "https://example.org";
               $("#inIdDoc").addClass("has-error");
               //$("#inIdDoc").addClass("form-group");
           }*/
           var ndoc = text.length.toString();
           var res =  "<"+urldoc+"#char=0,"+ndoc+">\n"+
           "        a nif:String , nif:Context  , nif:RFC5147String ;\n"+
           "        nif:isString \"\"\""+text+"\"\"\"^^xsd:string ;\n"+
           "        nif:beginIndex \"0\"^^xsd:nonNegativeInteger ;\n"+
           "        nif:endIndex \""+ndoc+"\"^^xsd:nonNegativeInteger ;\n"+
           "        nif:sourceUrl <"+urldoc+"> .\n\n";
                    
           final_res = replaceAll(res,"<","&lt;");
           final_res = replaceAll(final_res,"<","&gt;");
           final_res = replaceAll(final_res,"\n","<br>");
           final_res = replaceAll(final_res," ","&nbsp;");
       
           //update Content Summary

       //$("#info_numbersentences").html(Sentences.length.toString());
       //$("#info_numberannotations").html(A.length.toString());
       //$("#info_numbercaracters").html(text.length.toString());       
       return final_res;
    };


    // obtengo la lista de anotaciones de una oración especificada en forma ordenada
    getSentencesAnnotations = function(ids){
        var SortedList = []; // Lista ordenada de las annotaciones según la posicion inicial de cada una
        var temp = [];
        for (i in A){
            ann = A[i];
            //console.log("------ ");
            //console.log(ann);
            //console.log("id_sentence:",ann["id_sentence"],"  ids:",ids);
            if (ann["id_sentence"] == ids){
               //insertar la annotación en su posición, que quede ordenado el arreglo por la posición inicial
               //supongo que ya SortedList esta ordenado               
               var inserted = false;
               for (j in SortedList){ // voy poniendo "e" en "temp" hasta que le toque a "ann"
                   var index_j = parseInt(j);
                   e = SortedList[j];
                   if (ann["ini"]==e["ini"] && !inserted){ // ordeno segun "fin"
                       if (ann["fin"]==e["fin"] && ann["id_sentence"]==e["id_sentence"]){
                           console.log(["ann:",ann,"  e:",e]);
                           warning_alert("This entity has already added.");
                           return 0; 
                       }
                       if (SortedList.length-1 == index_j){// en caso de que "e" sea el último
                           inserted = true;
                           if (ann["fin"]<e["fin"]){
                               temp.push(ann);
                               temp.push(e);
                           }
                           else{
                               temp.push(e);
                               temp.push(ann);
                           }
                           inserted = true;
                       }
                       else{
                           var e2 = SortedList[index_j+1];
                           if (ann["fin"]<e2["fin"]){
                               temp.push(ann);
                               temp.push(e);
                               inserted = true;
                           }
                           else{
                               temp.push(e);
                           }
                       }
                   } else if (ann["ini"]<e["ini"] && !inserted){  // inserto primero ann, y después e
                       inserted = true;
                       temp.push(ann);
                       temp.push(e);
                   } 
                   else{
                       temp.push(e);
                   }
               }
               if (!inserted){
                   temp.push(ann);
               }
               SortedList = temp;
               temp = [];
            }
        }
        return SortedList;
    };

    
    // elimino una oracion y actualizo el NIF de salida
    delete_sentence = function(id_sent){
      BootstrapDialog.show({
            title: 'Erasing sentence',
            message: 'Are you sure you want to delete the sentence?',
            buttons: [{
                cssClass: 'btn-primary',
                label: 'Yes',
                action: function(dialog) {
                    delete_sentence_yes(id_sent);
                    buildNIFCorpora();
                    dialog.close();
                }
            }, {
                label: 'No',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
       
    }
    
    
    delete_sentence_yes = function(id_sent){
       //
       var sent = Sentences[id_sent]["text"];
       var sent_uri_doc = Sentences[id_sent]["uridoc"];
       var inDocCounter = uri2inDocCounter(Sentences[id_sent]["uridoc"])
       var n_sentence = sent.length;
       Sentences.splice(id_sent, 1);
       
       //Busco el id de las annotaciones de esa oracion
       var List_to_Erase = [];
       for (i in A){
           ann = A[i];
           if (parseInt(ann["id_sentence"]) == parseInt(id_sent)){
              //A.splice(i, 1);
              List_to_Erase.push(i);
           }
           else if (parseInt(ann["id_sentence"]) > parseInt(id_sent)){ //actualizo el id
              ann["id_sentence"] = ann["id_sentence"] - 1;
              if (ann["uridoc"]==sent_uri_doc){
                  ann["ini"] = ann["ini"] - n_sentence-1;
                  ann["fin"] = ann["fin"] - n_sentence-1;
              }
           }
        }
        //console.log(List_to_Erase);
        // ordeno las ids para entonces eliminar de atras para adelante, ya que se modifican los ids cada vez que uno se elimina
        List_to_Erase.sort(function(a, b){return b-a});
        //console.log(List_to_Erase);
        
        // Elimino las annotaciones de esa oración
        for (e in List_to_Erase){
            ida = List_to_Erase[e];
            A.splice(ida, 1);
        }
        
        // Actualizo los ids que tienen ls annotaciones sobre ellas mismas
        /*for (i in A){
            ann = A[i];
            ann["idA"] = i;
        }*********/
        
        
        
        // update main text
        /*var newText = "";
        for (i in Sentences)
        {
            newText = newText + Sentences[i]["text"] + "\n"; 
        }
        
        $("#inDoc"+inDocCounter).val(newText);*****/
        
        // update views
        ///////buildNIFCorpora();
    };
    
    
    // return the 
    uri2inDocCounter = function (uridoc){
        /*
        for (d in D){
            doc = D[d];
            if (doc["uri"] == uridoc){
                return doc["inDocCounter"];
            }
        }*/
        return dicc_uri2inDocCounter[uridoc];
    }
    
    
    // como cada anotacion puede tener mas de un enlace entonces aqui devuelvo el tipo del enlace, dando preferencia a [PERSON, ORG, PLACE] sobre MISC, si no hay enlace devuelvo undefined
    typeOfAnn = function(list_links){
        var ttemp = undefined;
        if (list_links.length == 0) return undefined;
        for (k in list_links){
            var l = list_links[k];
            var tt = link2type[l];
            if (tt != undefined){
                if (tt == "mnt:Person" || tt == "mnt:Organisation" || tt == "mnt:Place"){
                    return tt;
                }
                else {ttemp = "mnt:Miscellany";}
            }
        }
        return ttemp;
    }

    // actualizo las anotaciones de las oraciones y actualizo el div de visualización
    type2icon = {
        "mnt:Person": "glyphicon-user",
        "mnt:Organisation" : "glyphicon-briefcase",
        "mnt:Place": "glyphicon-map-marker",
        "mnt:Miscellany" : "glyphicon-tag"        
    }
    w2type = {
        "PERSON":"mnt:Person",
        "ORG":"mnt:Organisation",
        "PLACE":"mnt:Place",
        "MISC":"mnt:Miscellany"
    };
    
    type2w = {
        "mnt:Person":"PERSON",
        "mnt:Organisation":"ORG",
        "mnt:Place":"PLACE",
        "mnt:Miscellany":"MISC"
    };
    
    updateAnnotatedSentHTML = function(idd){
         //console.log("updateAnnotatedSentHTML..");
         var doc = D[idd];
         var inDocCounter = doc["inDocCounter"];
         var urldoc = doc["uri"];
      
         text = "";
         var textOut = "";

         var ini;
         var fin;
         var label;
         var overall = 0;
         //var lasUriDoc = "";
         for (i in Sentences){
             if (Sentences[i]["uridoc"] != urldoc){
                 continue;
             }
             sent = Sentences[i]["text"];
             if (text == ""){
                 text = sent;
             }
             text = text +"\n"+sent;

             var temp_i = parseInt(i);
  
             
             textOut = textOut + '<div class="div_parent"><div class="right-wrapper"><div class="right"><div style="width: 100%;padding-left:10px;">';

             //
             var SentencesAnnotations = getSentencesAnnotations(i); // obtengo la lista de anotaciones de la oración actual de forma ordenada
             if (SentencesAnnotations.length != 0){
                 var pos = 0;
                 for (j in SentencesAnnotations){
                     
                     var index = parseInt(j);
                     //console.log(SentencesAnnotations.length);
                     ann = SentencesAnnotations[j];
                     
                     if (_filter.length != 0 && ann["tag"]!=undefined && ann["tag"].length!=0){
                         var commonValues = _filter.filter(function(value) { 
                            return ann["tag"].indexOf(value) > -1;
                         });
                         //console.log("...>>");
                         //console.log(commonValues);
                         //console.log(commonValues.length);
                         //console.log(_filter);
                         //console.log(ann["tag"]);
                         if (commonValues.length == 0){continue;}
                     }
                     
                     //console.log("-->",ann);
                     var ini = ann["ini"] - overall;
                     var fin = ann["fin"] - overall;
                     if (index+1 < SentencesAnnotations.length){ // si no es el ultimo, y además, hay overlapping
                         //console.log(SentencesAnnotations);
                         //console.log(index);
                         var ann2 = SentencesAnnotations[index+1];
                         if (ann["fin"]>ann2["ini"]){
                             fin = ann2["ini"] - overall;
                             ann["overlap"] = true;
                             ann2["overlap"] = true;
                             //console.log("OPTT");
                         }
                     }
                     label = sent.substring(ini, fin);

                     var st = "";
                     if ("tag" in ann){
                         if (ann["tag"].indexOf("tax:Ambiguous")>-1){
                             st = 'style="background-color: #5cb85c;"';
                         }
                     }
                     if ("overlap" in ann){
                         if (ann["overlap"] == true){
                             st = 'style="background-color: #88783a;"';
                         }
                         ann["overlap"] = false;
                     }
                     //--
                     var mentionType = "";
                     var ttype = typeOfAnn(ann["uri"]); // como cada anotacion puede tener mas de un enlace entonces aqui devuelvo el tipo del enlace, dando preferencia a [PERSON, ORG, PLACE] sobre MISC, si no hay enlace devuelvo undefined
                     //console.log(ttype);
                     if ( ttype != undefined){
                       mentionType = '<i class="glyphicon '+type2icon[ttype]+'"></i>&nbsp;';  
                     }
                     //--
                     var httpTags = "";
                     if ("tag" in ann){
                         httpTags = ann["tag"].join()+"\n";
                     }
                     httpAnnotation = '<span ide="'+ann["idA"]+'"  class="blueLabel classlabelAnnotation"  data-toggle="tooltip" title="'+httpTags+ann["uri"].join()+'" '+st+'>'+mentionType+label+'</span>';
                     textOut = textOut + sent.substring(pos,ini) + httpAnnotation;
                     pos = fin;
                 }  
                 textOut = textOut + sent.substring(pos,sent.length)+"<br>&nbsp;";
             }
             else{
                 textOut = textOut + sent +"<br>&nbsp;";
             }
             //textOut = textOut + "<br><br>";
             var temp_i_plus_1 = temp_i +1;
             textOut = textOut + '</div></div></div>'+ 
             '<div class="left div_line"> &nbsp;'+temp_i_plus_1.toString()+
             " <a href='javascript:delete_sentence("+temp_i.toString()+")'><i style='color:red!important;' class='fa fa-trash'></i></a>"+
             '</div></div>';
             overall = overall+sent.length+1;
         }
         ////$("#sentencesDoc").html(textOut);
         $("#sentencesDoc"+inDocCounter).html(textOut);
         
         //Updating the left panel 
         /*var _html = '<div class="row parent_div_show drop-shadow">'+
        '<div style="class="col-lg-12">'+
            '<div id="doc'+inDocCounter+'" class="row">'+
                '<div class="col-lg-6">'+
                    '<div class="input-group control-group">'+
                        '<input type="text" style="width:100%!important;height:35px;" value="'+urldoc+'" id="urldoc"'+inDocCounter+'/>'+
                        '<div class="input-group-btn"> '+
                            '<button id="modifyIdDoc" class="btn btn-secondary" type="button"><i class="glyphicon glyphicon-edit"></i> Modify</button>'+
                        '</div>'+
                    '</div>'+
                    '<textarea class="form-control" id="inDoc'+inDocCounter+'" rows="3" style="min-height:100px;" placeholder="Enter the document in plain text" readonly>'+text+'</textarea>'+
                    '<button id="btn_3_annotation'+inDocCounter+'" inDocCounter="'+inDocCounter+'" type="button" class="btn btn-primary margin_buttons btn_annotation"> <i class="fa fa-hand-pointer-o fa-lg"></i> Annotate Entity</button>'+
                
                '</div>'+
                '<div id="sentencesDoc'+inDocCounter+'" class="col-lg-6 noselect" style="min-height:100px;"> '+
                    '-- EMPTY -- '+
                '</div>'+
            '</div>'+
        '</div>'+
       '</div><br>';

       $("#DisplayBlock").prepend(_html);*/
       //console.log("...updateAnnotatedSentHTML");
    };

    // Construyo las tripletas NIF de las oraciones
    updateAnnotatedSentNIF = function(idd){
        /*
        // -- Added
        //var Totalitem_type = "";
        var place_mention = "None";
        var tp = $('#btn_place_types_entities').html();
        if (tp == '<i class="glyphicon glyphicon-arrow-up"></i>'){
            place_mention = "Top";
        }
        else if (tp == '<i class="glyphicon glyphicon-arrow-down"></i>'){
            place_mention = "Bottom";
        }
        else if (tp == '<i class="glyphicon glyphicon-random"></i>'){
            place_mention = "Mix";
        }*/
        //alert(place_mention);
        
        // --------
        
        
        //console.log("updateAnnotatedSentNIF...");
        var doc = D[idd];
        var inDocCounter = doc["inDocCounter"];
        var urldoc = doc["uri"];

        var res = "";
        var text = $("#inDoc"+inDocCounter).val();
        text = replaceAll(text,"\n"," ");
        /////var urldoc = $("#inIdDoc").val();
        ///if (!urldoc){
        ////    urldoc = "https://example.org";
        ////}
        var ndoc = text.length.toString();

        //Pongo todas las sentencias en el NIF
        overall = 0;
        for (i in Sentences){
            if (Sentences[i]["uridoc"]!=urldoc){continue;}
            var sent = Sentences[i]["text"];
            //console.log(i," ->",sent," (",sent.length,")");
            if (sent.length == 0  ||  (sent.length == 0 && (sent==" "||sent=="\n"||sent=="\t"))){continue;}
            var sent_ini = text.indexOf(sent);
            var nsent = sent.length;
            var sent_fin = sent_ini + nsent;
            var overall_t = overall.toString();
            var overallFinal= overall + nsent;
            var overallFinal_t = overallFinal.toString();
            var nifAnnotation;
            var ini_t;
            var fin_t;
            
            var sent_uri = "<"+urldoc+"#char="+overall_t+","+overallFinal_t+">";
            var s = sent_uri + "\n"+
                   "        a nif:String , nif:Context , nif:RFC5147String ;\n"+// "        a nif:String , nif:Sentence , nif:RFC5147String ;\n"+
                   "        nif:isString \"\"\""+sent+"\"\"\"^^xsd:string ;\n"+//"        nif:anchorOf \"\"\""+sent+"\"\"\"^^xsd:string ;\n"+
                   "        nif:beginIndex \""+overall_t+"\"^^xsd:nonNegativeInteger ;\n"+
                   "        nif:endIndex \""+overallFinal_t+"\"^^xsd:nonNegativeInteger ;\n"+
                   //"        nif:referenceContext <"+urldoc+"#char=0,"+ndoc+"> .\n\n"; ----->
                   "        nif:broaderContext <"+urldoc+"#char=0,"+ndoc+"> .\n\n";
            res = res + s;
            /////////idSentence2dicc[i] = {"uri": sent_uri, "ini":sent_ini, "fin":sent_fin, "len":nsent};

            //Pongo todas las anotaciones de esta oración
            var SentencesAnnotations = getSentencesAnnotations(i); // obtengo la lista de anotaciones de la oración actual de forma ordenada
             //console.log("Arr:",SentencesAnnotations);
             if (SentencesAnnotations.length != 0){
                 for (j in SentencesAnnotations){
                     //console.log(SentencesAnnotations.length);
                     ann = SentencesAnnotations[j];
                     
                     if (_filter.length != 0 && ann["tag"]!=undefined && ann["tag"].length!=0){
                         var commonValues = _filter.filter(function(value) { 
                            return ann["tag"].indexOf(value) > -1;
                         });
                         console.log("...>>");
                         console.log(commonValues);
                         console.log(commonValues.length);
                         console.log(_filter);
                         console.log(ann["tag"]);
                         if (commonValues.length == 0){continue;}
                     }
                     //console.log("-->",ann);
                     ini = ann["ini"] - overall;
                     fin = ann["fin"] - overall;
                     label = sent.substring(ini, fin);
                     
                     var annotation_comment = "";
                     if ("comment" in ann && ann["comment"].length!=0){
                         annotation_comment = "        rdfs:comment \"\"\""+ann["comment"]+"\"\"\"^^xsd:string ;\n";
                     }
                     
                     ini_t = ini.toString();
                     fin_t = fin.toString();
                     nifAnnotation = "<"+urldoc+"#char="+ini_t+","+fin_t+">\n" + 
                                     "        a nif:String , nif:Context , nif:Phrase , nif:RFC5147String ;\n"+
                                     //"        nif:Context "+sent_uri+" ;\n"+//"        nif:sentence "+sent_uri+" ;\n"+
                                     "        nif:referenceContext "+sent_uri+" ;\n"+//"        nif:sentence "+sent_uri+" ;\n"+
                                     //"        nif:referenceContext <"+urldoc+"#char=0,"+ndoc+"> ;\n"+
                                     "        nif:context <"+urldoc+"#char=0,"+ndoc+"> ;\n"+
                                     "        nif:anchorOf \"\"\""+label+"\"\"\"^^xsd:string ;\n"+
                                     "        nif:beginIndex \""+ini_t+"\"^^xsd:nonNegativeInteger ;\n"+
                                     "        nif:endIndex \""+fin_t+"\"^^xsd:nonNegativeInteger ;\n"+
                                     annotation_comment;
                     if ("tag" in ann){
                         if (ann["tag"].length>0){
                             var temp_tag = "";
                             for (tt in ann["tag"]){
                                 if (temp_tag == ""){
                                     temp_tag = ann["tag"][tt];
                                 }
                                 else{
                                     temp_tag = temp_tag + ", " + ann["tag"][tt];
                                }
                             }
                             nifAnnotation = nifAnnotation + "        itsrdf:taClassRef "+temp_tag+" ;\n";
                         }
                     }
                     var item_type = "";
                     for (k in ann["uri"]){
                         var a_ = ann["uri"][k];
                         var a_w = "<" + a_;
                         
                         //--
                         if (a_.indexOf("mnt:entityType")!=-1){
                             var ttt = "mnt:Miscellany";
                             if (a_.indexOf("mnt:Person")!=-1){
                                 ttt = "mnt:Person";
                             } 
                             else if (a_.indexOf("mnt:Organisation")!=-1){
                                 ttt = "mnt:Organisation";
                             }
                             else if (a_.indexOf("mnt:Place")!=-1){
                                 ttt = "mnt:Place";
                             }
                             a_w = "[mnt:entityType "+ttt+"] ;\n        itsrdf:taIdentRef <https://en.wikipedia.org/wiki/NotInLexico"
                         }
                         //--
                         
                         nifAnnotation = nifAnnotation + "        itsrdf:taIdentRef "+a_w+"> ";
                         if (k == ann["uri"].length-1){ //last
                             nifAnnotation = nifAnnotation + ".\n\n";
                         } else{nifAnnotation = nifAnnotation + ";\n";}
                         
                         // entity type --
                         if (a_.indexOf("mnt:entityType")==-1 && WrittedInNif.indexOf(a_)==-1){
                             var tp = link2type[a_];
                             if (tp != undefined){
                                   item_type = item_type + "<"+a_+"> mnt:entityType "+tp+" .\n" ;
                             }
                             
                             WrittedInNif.push(a_);
                         }
                         
                         // ---
                     }
                     res = res + nifAnnotation;
                     if (place_mention == "Mix" && item_type!=""){
                         res = res + item_type + "\n";
                     }
                     else if (item_type!=""){
                         Totalitem_type = Totalitem_type + item_type;
                    }
                     
                     
                 }  
            }
            overall = overall + nsent +1;
        }
        
        
        /*if (Totalitem_type!=""){
            if (place_mention == "Top"){
                res = Totalitem_type + "\n" + res;
            } 
            else if (place_mention == "Bottom"){
                res = res + Totalitem_type + "\n";
            }
        }*/
        final_res = replaceAll(res,"<","&lt;");
        final_res = replaceAll(final_res,"<","&gt;");
        final_res = replaceAll(final_res,"\n","<br>");
        final_res = replaceAll(final_res," ","&nbsp;");
        //console.log("...updateAnnotatedSentNIF");
        return final_res;
    };


    // crea el nif de las oraciones, y actualiza las anotaciones
    buildNIFSentences = function(idd){
        var res = "";
        updateAnnotatedSentHTML(idd);
        return updateAnnotatedSentNIF(idd);
    }
    
    
    

    //crea el nif de todo, documento, sentencias y sus anotaciones
    WrittedInNif = []; // esta variable es para ir guardando los links que voy escribiendo
    // en el fichero y asi no los repito
    Totalitem_type = ""; // Esta variable es para guardar las annotaciones de los enlces mnt:entityType, y ver si los pongo a inicio, final etc
    place_mention = ""; // Esta me dice si poner estas entityType al inicio, medio o final
    buildNIFCorpora = function(){
        WrittedInNif = [];
        Totalitem_type = "";
        // -- Added
        //var Totalitem_type = "";
        place_mention = "None";
        var tp = $('#btn_place_types_entities').html();
        if (tp == '<i class="glyphicon glyphicon-arrow-up"></i>'){
            place_mention = "Top";
        }
        else if (tp == '<i class="glyphicon glyphicon-arrow-down"></i>'){
            place_mention = "Bottom";
        }
        else if (tp == '<i class="glyphicon glyphicon-random"></i>'){
            place_mention = "Mix";
        }
        
        $(".parent_div_show").remove();
        //CleanAnnotationDocument();
        nif_head = "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n"+
                 "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n"+
                 "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n"+
                 "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n"+
                 "@prefix nif: <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#> .\n"+
                 "@prefix itsrdf: <http://www.w3.org/2005/11/its/rdf#> .\n"+
                 "@prefix dbo: <http://dbpedia.org/ontology/> .\n\n";

        
        nif_head = replaceAll(nif_head,"<","&lt;");
        nif_head = replaceAll(nif_head,"<","&gt;");
        nif_head = replaceAll(nif_head,"\n","<br>");
        nif_head = replaceAll(nif_head," ","&nbsp;");
        
        nif = "";
        for (d in D){
            nif = nif + buildContext(d);
            nif = nif + buildNIFSentences(d);
        }
        
        if (Totalitem_type!=""){
            Totalitem_type = replaceAll(Totalitem_type,"<","&lt;");
            Totalitem_type = replaceAll(Totalitem_type,"<","&gt;");
            Totalitem_type = replaceAll(Totalitem_type,"\n","<br>");
            Totalitem_type = replaceAll(Totalitem_type," ","&nbsp;");
            
            if (place_mention == "Bottom"){
                nif = nif_head + nif + Totalitem_type;
            }
            else if(place_mention == "Top"){
                nif = nif_head + Totalitem_type +"<br>" + nif;
            }
            else if(place_mention == "None" || place_mention == "Mix"){
                 nif = nif_head + nif;
            }
        }
        else{
            nif = nif_head + nif;
        }
        
        //$("#nifdoc").text(nif);
        document.getElementById('nifdoc').innerHTML = nif;

        //le pongo un heigh a los textarea
        $('.textareaclass').each(function() {
            var idc = $(this).attr("idc");
            var h = $('#sentencesDoc'+idc).innerHeight();
            if (h>100){
                h = h -30;
            }
            $(this).css('height', h);
        });
    };


   ///---------- select types (Select2) --------------------

   /*$("#taxonomyInput").select2({
    createSearchChoice:function(term, data) { 
        if ($(data).filter(function() { 
            return this.text.localeCompare(term)===0; 
        }).length===0) 
        {return {id:term, text:term};} 
    },
    multiple: true,
    //data: [{id: 0, text: 'nerd:Organization'},{id: 1, text: 'dbpo:Company'},{id: 2, text: 'task'}]
    data:[        
        {id: 0, text: 'mnt:FullMentionPN'},
		{id: 1, text: 'mnt:ShortMentionPN'},
		{id: 2, text: 'mnt:ExtendedMentionPN'},
		{id: 3, text: 'mnt:AliasPN'},
        {id: 4, text: 'mnt:NumericTemporalPN'},
        {id: 5, text: 'mnt:DescriptivePN'},
        {id: 6, text: 'mnt:PronounPN'},
		{id: 7, text: 'mnt:SingularNounPoS'},
		{id: 8, text: 'mnt:PluralNounPoS'},
		{id: 9, text: 'mnt:AdjectivePoS'},
		{id: 10, text: 'mnt:VerbPoS'},
		{id: 11, text: 'mnt:AntecedentR'},
		{id: 12, text: 'mnt:CoreferenceR'},
		{id: 13, text: 'mnt:Non-Overlapping'},
		{id: 14, text: 'mnt:MaximalOverlap'},
		{id: 15, text: 'mnt:MinimalOverlap'},
		{id: 16, text: 'mnt:IntermediateOverlap'},
		{id: 17, text: 'mnt:LiteralR'},
		{id: 18, text: 'mnt:FigurativeR'},
		{id: 19,text: 'tax:Ambiguous'},
    ]
    });*/
   
   
   ListTaxonomy = [        
        {id: 0, text: 'mnt:FullMentionPN'},
		{id: 1, text: 'mnt:ShortMentionPN'},
		{id: 2, text: 'mnt:ExtendedMentionPN'},
		{id: 3, text: 'mnt:AliasPN'},
        {id: 4, text: 'mnt:NumericTemporalPN'},
        {id: 5, text: 'mnt:CommonFormPN'},
        {id: 6, text: 'mnt:Pro-formPN'},
		{id: 7, text: 'mnt:SingularNounPoS'},
		{id: 8, text: 'mnt:PluralNounPoS'},
		{id: 9, text: 'mnt:AdjectivePoS'},
		{id: 10, text: 'mnt:VerbPoS'},
		{id: 11, text: 'mnt:AntecedentRf'},
		{id: 12, text: 'mnt:CoreferenceRf'},
		{id: 13, text: 'mnt:Non-Overlapping'},
		{id: 14, text: 'mnt:MaximalOverlap'},
		{id: 15, text: 'mnt:MinimalOverlap'},
		{id: 16, text: 'mnt:IntermediateOverlap'},
		{id: 17, text: 'mnt:LiteralRh'},
		{id: 18, text: 'mnt:FigurativeRh'},
		{id: 19,text: 'tax:Ambiguous'},
    ];
    
    tax2id = {
        'mnt:FullMentionPN'     :0,
        'mnt:ShortMentionPN'    :1,
        'mnt:ExtendedMentionPN' :2,
        'mnt:AliasPN'           :3,
        'mnt:NumericTemporalPN' :4,
        'mnt:CommonFormPN'     :5,
        'mnt:Pro-formPN'         :6,
        'mnt:SingularNounPoS'   :7,
        'mnt:PluralNounPoS'     :8,
        'mnt:AdjectivePoS'      :9,
        'mnt:VerbPoS'           :10,
        'mnt:AntecedentRf'       :11,
        'mnt:CoreferenceRf'      :12,
        'mnt:Non-Overlapping'   :13,
        'mnt:MaximalOverlap'    :14,
        'mnt:MinimalOverlap'    :15,
        'mnt:IntermediateOverlap':16,
        'mnt:LiteralRh'          :17,
        'mnt:FigurativeRh'       :18,
        'tax:Ambiguous'         :19,
    }
   
   
   $(".taxonomyInputClass").select2({
    createSearchChoice:function(term, data) { 
        if ($(data).filter(function() { 
            return this.text.localeCompare(term)===0; 
        }).length===0) 
        {return {id:term, text:term};} 
    },
    multiple: true,
    //data: [{id: 0, text: 'nerd:Organization'},{id: 1, text: 'dbpo:Company'},{id: 2, text: 'task'}]
    data:ListTaxonomy
    });
   
   
   

    //---- right buttons
    $("#btn_update").click(function(){
        buildNIFCorpora();
    });



    //---- uploaddddddd
    $("#btn_upload").click(function(){
        typeUpload = "main";
        $("#modalUpload").modal("show");
    });

    /*
     http://plugins.krajee.com/file-basic-usage-demo
     $("#inputFile").fileinput({
        showPreview: false,
        showUpload: false,
        elErrorContainer: '#kartik-file-errors',
        allowedFileExtensions: ["jpg", "png", "gif"]
        //uploadUrl: '/site/file-upload-single'
    });*/


    $("#input-b9").fileinput({
        showPreview: false,
        showUpload: false,
        elErrorContainer: '#kartik-file-errors',
        allowedFileExtensions: ["ttl", "rdf", "xml"]
        //uploadUrl: '/site/file-upload-single'
    });

    var upload = function() {
        var photo = document.getElementById("fileNif");
        return false;
    };

 
    //see https://www.html5rocks.com/en/tutorials/file/dndfiles/
    function readBlob(opt_startByte, opt_stopByte) {
        var files = document.getElementById('input-b9').files;
        if (!files.length) {
            warning_alert('Please select a file!');
            return;
        }

        var file = files[0];
        
        file_temp = file;
        fr = new FileReader();
        fr.onload = function(e){
            var result = e.target.result;
            textFromUpload = e.target.result;
            if (typeUpload == "main"){
                CleanAnnotationDocument();
                $("#btn_inputNIF").click();                
            }
            else {
                parseSystemsInput();
            }
        }
        fr.readAsText(file);
    }

        
    $('#modalUpload_upload').click(function(evt) {
        if (evt.target.tagName.toLowerCase() == 'button') {
            var startByte = evt.target.getAttribute('data-startbyte');
            var endByte = evt.target.getAttribute('data-endbyte');
            readBlob(startByte, endByte);
        }
        $("#divShow").removeClass("hide");
    });


    //-------- download
    $("#btn_download").click(function(){
        /*BootstrapDialog.show({
            message: "It's not working yet :("
        });*/
        
	if ('Blob' in window) {
	  BootstrapDialog.show({
            message: '<label for="filename_input" class="col-form-label">File Name:</label> ' +
                     '<input type="text" class="form-control espacioAbajo" id="filename_input" '+
                     'placeholder="Name of the file">',
            title: 'File Name Input',
            buttons: [{
                label: 'Close',
                action: function(dialog) {
                    dialog.close();
                }
            }, {
                label: 'Ok',
                action: function(dialog) {
                    var fileName = $("#filename_input").val();
                    if (fileName) {
                        var htmlText = $('#nifdoc').html();
                        htmlText = replaceAll(htmlText,"&nbsp;"," ");
                        var textToWrite = Encoder.htmlDecode(replaceAll(htmlText,"<br>","\n"));
                        var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
                        if ('msSaveOrOpenBlob' in navigator) {
                            navigator.msSaveOrOpenBlob(textFileAsBlob, fileName);
                        } else {
                            var downloadLink = document.createElement('a');
                            downloadLink.download = fileName;
                            downloadLink.innerHTML = 'Download File';
                            if ('webkitURL' in window) {
                                // Chrome allows the link to be clicked without actually adding it to the DOM.
                                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                            } else {
                                // Firefox requires the link to be added to the DOM before it can be clicked.
                                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                                downloadLink.onclick = function(){};
                                downloadLink.style.display = 'none';
                                document.body.appendChild(downloadLink);
                            }
                        downloadLink.click();
                        }
                    }
                    dialog.close();
                }
            }]
        });
	  
	} else {
	  alert('Your browser does not support the HTML5 Blob.');
	}

    });



    if (!String.prototype.trim) {
	  String.prototype.trim = function () {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	  };
	}



    ///----
    trim_1 = function(txt){
        var ini = 0;
        var fin = txt.length-1;
        
        while ((txt[ini] == " " || txt[ini] == "<" || txt[ini] == ">") && ini!=txt.lenth){
            ini = ini +1;
            //console.log("avoiding ini:",txt[ini-1]);
        }
        
        var parentesis = false;
        while ((txt[fin] == " " || txt[fin] == "<" || txt[fin] == ">" || (parentesis== false && txt[fin] == ".") || txt[fin] == "\n") && fin!=0){
            fin = fin -1;
            //console.log("avoiding fin:",txt[fin+1]);
            if (txt[fin] == ">" || txt[fin] == "<"){ parentesis = true;}
        }
        
        //console.log(ini,fin);
        return txt.substr(ini,fin-ini+1);
    }
    
    
    
    
    parser_NIF = function(text,tag){
        //console.log(["text:",text]);
        //console.log(["tag:",tag]);
        state = 0;
        var p = 0;
        if (tag!=false){
            p = text.indexOf(tag);
            if (p == -1) {return false;} 
        }
        //console.log(["p:",p,p != -1,p<text.lenth,text.length]);
        tt = "";
        p = p -1;
        //console.log("dentro");
        while (p<text.length){
            p = p +1;
            ch = text[p];
            //console.log(["(",state,")",p,ch]);
            
            if (state == 0){ // search the doble comilla
                if (ch=='"'){ 
                    state = 1;
                }
                else if (ch=='<'){
                    state = 10;
                }
                else if (ch=='['){
                    state = 20;
                }
            }
            else if (state == 1){  // doble or simple?
                if (ch == '"'){
                    state = 3;
                }
                else{
                    tt = tt + ch;
                    state = 2; // simple
                }
            }
            else if (state == 2){ // consume until simple
                if (ch == '"'){
                    return [p,tt];
                }
                else if (ch == '\\'){
                    state = 6;
                }
                else {
                    tt = tt + ch;
                }
            }
            else if (state == 3){
                if (ch == '"'){
                    state = 4;
                }
                else {
                    //console.log(ch,":(");
                    return false;
                }
            }
            else if (state == 4){ // consume until doble
                if (ch == '"'){
                    state = 7;
                }
                else if (ch == "\\"){
                    state = 5;
                }
                else {
                    tt = tt + ch;
                }
            }
            else if (state == 5){
                state = 4;
                tt = tt +ch;
            }
            else if (state == 6){
                state = 2;
                tt = tt +ch;
            }
            else if (state == 7){
                if (ch == '"'){
                    state = 8;
                }
                else {
                    tt = tt + '"' + ch;
                    state = 4;
                }
            }
            else if (state == 8){
                if (ch == '"'){
                    return [p,tt];
                }
                else{
                    tt = tt + '""' + ch;
                    state = 4;
                }
            }
            else if (state == 10){
                if (ch!='>'){
                    tt = tt + ch;
                }
                else {
                    return [p,tt];
                }
            }
            else if (state == 20){
                if (ch!=']'){
                    tt = tt + ch;
                }
                else {
                    return [p,tt];
                }
            }
        }

        //console.log("nada?");
        return false;
    }
    
    parseURI = function(text){
        var p = -1;
        var state = 0;
        var tt = "";
        var uri_doc = "";
        var uri_sent = "";
        var ini_sent = "";
        var fin_sent = "";
        
        while (p<text.length){
            p = p +1;
            var ch = text[p];
            
            
            //console.log(["(",state,")",p,ch,"   tt:",tt]);
            
            if (state == 0){
                if (ch == "<"){
                    state = 1;
                }
            }
            else if (state == 1){
                if (ch == ">"){
                    return [tt,"","",""];
                }
                if (ch == "#"){
                    state = 2;
                    uri_doc = tt;
                    tt = tt + ch;
                }
                else {
                    tt = tt + ch;
                }
            }
            else if (state == 2){
                if (ch == ">"){
                    return [uri_doc,tt,"",""]
                }
                else if (ch == "="){
                    tt = tt + "=";
                    state = 3;
                }
                else{
                    tt = tt + ch;
                }
            }
            else if (state == 3){
                if (isNumber(ch) == true){
                    tt = tt + ch;
                    ini_sent = ini_sent + ch;                    
                }
                else if (ch == ","){
                    state = 4;
                    tt = tt + ch;
                }
                else if (ch == ">"){
                    return [uri_doc,tt,ini_sent,""];
                }
                else {
                    state = 5;
                    tt = tt + ch;
                }
            }
            else if (state == 4){
                if (isNumber(ch) == true){
                    fin_sent = fin_sent + ch;
                    tt = tt + ch;
                }
                else if (ch == ">"){
                    return [uri_doc,tt,ini_sent,fin_sent];
                }
                else {
                    state = 5;
                    tt = tt + ch;
                }
            }
            else if (state == 5){
                if (ch == ">"){
                    return [uri_doc,tt,"",""]
                }
                else {
                    tt = tt + ch;
                }
            }
            
        }
        
    }
    
    
    _inDocCounter = 0;
    _inSentenceIni= 0;
    reading_sentence = function(chunk){
        //console.log(";)");
        var p_isString = chunk.indexOf("nif:isString");
        if (p_isString == -1){
            console.log("--->> Error, there musts be a nif:isString triple (start)");
            return false;
        }
        //console.log("B)");
        var n_chunk = chunk.length;
        var r_text = chunk.substring(p_isString, n_chunk);

        var sent_text = parser_NIF(chunk,"nif:isString")[1];
        //console.log(":P");
        var rr = parseURI(chunk);
        var _uridoc = rr[0];
        var _urisent = rr[1]; if (_urisent == ""){_urisent = _uridoc;}
        var _ini = rr[2]; if (_ini == ""){_ini = _inSentenceIni; _inSentenceIni = _inSentenceIni +1;}
        var _fin = rr[3];
        //console.log(["rr",rr,"uridoc:",_uridoc]);
        //console.log(["Sentences:",Sentences]);
        //console.log(["_urisent:",_urisent]);
        
        
        //
        if (uridoc2id(D,_uridoc) == -1){            
            D.push({"uri":_uridoc, "inDocCounter":_inDocCounter});
            dicc_uri2inDocCounter[_uridoc] = _inDocCounter;
            _inDocCounter = _inDocCounter +1;
        }  
        
        
        //
        var p_sent = urisent2id(Sentences,_urisent);
        if (p_sent == -1){
            var sent = {"text":sent_text, "uridoc":_uridoc, "id_sent":_urisent, "ini":parseInt(_ini), "fin":parseInt(_fin)};
            Sentences.push(sent);
            //console.log(":(");
            return sent;
        }
        
        else if (Sentences[p_sent]["text"] == undefined){
            //console.log(["--text:",sent_text]);
            Sentences[p_sent]["text"] = sent_text;
            Sentences[p_sent]["ini"] = parseInt(_ini);
            Sentences[p_sent]["fin"] = parseInt(_fin);
        }
        //console.log("xD");
        //console.log(["p_sent:",p_sent,"   Sentences[p_sent]:",Sentences[p_sent]]);
        return Sentences[p_sent];
    }
    
    
    $("#btn_inputNIF").click(function(){   // que no necesite estar ordenado el fichero
        //$(".parent_div_show").remove();
        CleanAnnotationDocument();
        var text = undefined;
        if (textFromUpload == undefined){
            text = $("#inDoc").val();
        } else{
          text = textFromUpload;
          textFromUpload = undefined;
        }
        var L = text.split("\n");
        var chunk = "";
        var id_s = 0; 
        var uridoc = "";
        var sent_uri;
        var overall = 0;
        var sent_text;
        _inDocCounter = 0;
        _inSentenceIni= 0;
        
        Sentences = [];
        D = [];
        inDocCounter = 1;
        for (i in L){
            //console.log(i);
            var l_raw = L[i];
            var l = l_raw.trim();
            if (l.length == 0){
               continue;
            }
            
            if (l[l.length-1]!="."){
                // add to chunck
                chunk = chunk + l;
            }
            else { //end of the chunk
                chunk = chunk + l;
                
                if (chunk.indexOf("@prefix")!=-1){
                    chunk = "";
                    continue;                        
                }
                
                var n_chunk = chunk.length;
                var p_ref = chunk.indexOf("nif:referenceContext");
                var p_bro = chunk.indexOf("nif:broaderContext");
                
                if (chunk.indexOf("nif:sourceUrl")!=-1){ // Document
                    //console.log("--> DOC");
                    chunk = "";
                    continue;
                }
                else if (p_ref!=-1  || p_bro!=-1 ){  // it is a Setence or an Annotation (nif:Phrase)
                    
                    if (chunk.indexOf("nif:Phrase")!=-1){  // It's an Annotation
                        
                        // quizas luego se puede hacer algo de ver si es la sentenia anterior no vlver a buscar
                        var rr = parseURI(chunk);
                        var _uridoc = rr[0];
                        var _uriann = rr[1];
                        var _ini = rr[2]; if (_ini == ""){_ini = _inSentenceIni; _inSentenceIni = _inSentenceIni +1;}
                        var _fin = rr[3];
                        
                        
                        // if the sentences appear in the annotation or not
                        var urisent = parser_NIF(chunk,"nif:referenceContext")[1];
                        if (urisent == false){
                            // get the uri of the document
                            urisent = _uridoc;
                        }
                        else {
                            var p_sent = urisent2id(Sentences,urisent);
                            if ( p_sent == -1){
                                sent = {"text":undefined, "uridoc":_uridoc, "id_sent":urisent};
                                Sentences.push(sent);
                            }
                        }
                        
                        var startPosition = parser_NIF(chunk,"nif:beginIndex")[1];
                        var endPosition = parser_NIF(chunk,"nif:endIndex")[1];
                        if (startPosition != _ini || endPosition != _fin){
                            addToValidLoad("Differences in the positions ("+startPosition+","+endPosition+") with the specified in the nif:Phrase "+_uriann);
                        }
                        
                        var label = parser_NIF(chunk,"nif:anchorOf")[1];
                        var list_uri = [];
                        var uri = parser_NIF(chunk,"itsrdf:taIdentRef");
                        var r_text = chunk.substring(uri[0],chunk.length);
                        while(uri != false){
                            list_uri.push(uri[1]);
                            if (uri[1].indexOf("mnt:entityType")!=-1){
                                break;
                            }
                            uri = parser_NIF(r_text,"itsrdf:taIdentRef");
                            r_text = r_text.substring(uri[0],r_text.length);
                        }

                        var id_s_t = id_s-1
                        ann = {   // esta variable global la voy a completar cuando  llene el URI y a taxonomia en el modal
                            "ini":parseInt(startPosition),
                            "fin":parseInt(endPosition),
                            //"id_sentence":undefined,
                            "urisent":urisent,
                            "label":label,
                            "uri": list_uri
                        };

                        //tags
                        //e.g., itsrdf:taClassRef nerd:AdministrativeRegion ;
                        var p_taClassRef = chunk.indexOf("itsrdf:taClassRef");
                        if (p_taClassRef != -1){
                            var r_text = chunk.substring(p_taClassRef, n_chunk);
                            var fin_taClassRef = r_text.indexOf(';');
                            if (fin_taClassRef == -1){
                                console.log("--->> Error, there musts be a nif:taClassRef triple (end)");
                                continue;
                            }
                            var tag_temp = r_text.substring(18,fin_taClassRef);
                            //tag_temp = tag.trim();
                            tag_temp = tag_temp.split(",");
                            var tag = [];
                            for (i in tag_temp){
                                var t = tag_temp[i];
                                //console.log(t);
                                tag.push(t.trim())
                            }
                            ann["tag"] = tag;
                        }
                        
                        //comment
                        var comment = parser_NIF(chunk,"rdfs:comment");
                        if (comment != false){
                            ann["comment"] = comment[1];
                        }
                        A.push(ann);
                    }
                    else{ // it's  Sentence
                        //console.log("--> SENT");
                        if (reading_sentence(chunk) == false){
                            return false;                        
                        }
                    }
                }
                else if (chunk.indexOf("mnt:entityType")!=-1){ // entity type
                    //console.log("--> TYPE");
                    var trp = chunk.split("mnt:entityType");
                    if (trp.length == 2){
                        var s = trim_1(trp[0]);                        
                        var o = trim_1(trp[1]);
                        link2type[s] = o;
                    }
                    
                }
                else{
                    // Same as Document and Sentence at the same time
                    //console.log("--> SENT/DOC");
                    if (chunk.indexOf("@prefix")==-1){
                        // sentence               
                        if (reading_sentence(chunk) == false){
                            return false;                        
                        }                      
                    }
                }
                chunk = "";
            }
        }

        // Display the sentences in the text area
        var text = "";
        for (i in Sentences){
            s = Sentences[i]["text"];
            text= text  + s + "\n";
        }
        n = text.length;
        $("#inDoc").val(text);

       // enable/disable buttons
        $("#divShow").removeClass("hide");

        sortValues_Sentences_A();
       //Update show-divs
       buildNIFCorpora();     
    });
    
    
    sortSentencesOfDoc = function(index){
        doc = D[index];
        var _uridoc = D[index]["uri"];
        
        Sorted_sentences = [];
        //  I suppose that Sorted_sentences is already sorted, and I'm going to insert the 
        // current sentences in its place
        var temp = [];
        for (s_i in Sentences){
            var sent = Sentences[s_i];
            if (sent["uridoc"] == _uridoc || sent["urisent"] == _uridoc){
                temp = [];
                var inserted = false;
                for (s_j in Sorted_sentences){
                    var o = Sorted_sentences[s_j];
                    if (!inserted){
                        if (sent["ini"] < o["ini"] ){
                            temp.push(sent);
                            temp.push(o);
                            inserted = true;
                        }
                        else {
                            //console.log("==> there");                            
                            //temp.push(sent);
                            temp.push(o);
                        }
                    } 
                    else{
                        temp.push(o);
                    }                
                }
                
                if (!inserted){
                    temp.push(sent);
                } 
                Sorted_sentences = temp;
            }
        }
        
        return Sorted_sentences;
    }
    
    
    addToValidLoad = function(msg,_uridoc,_urisent){
        var v = {
            "name":"Loading errors",
            "date":"-",
            "time":"-",
            "description":"Here we show the errors from the loading process.",
            "number_errors":"-",
            "errors":[],
            "type":"dinamic"
        };
        
        var pos = -1;
        for (_v_i in V){
            _v = V[_v_i];
            if (_v["name"] == v["name"]){
                pos = _v_i;
                break;
            }
        }
        
        //
        if (pos == -1){
            var newidV = 1;
            var Vkey = Object.keys(V);
            if (Vkey.length != 0){
                newidV = parseInt(Vkey[Vkey.length-1])+1;
            }
            
            V[newidV] = v;            
            pos = newidV;
        }
        
        //
        var count_errors = 1;
        if (V[pos]["number_errors"] != "-"){
            count_errors = parseInt(V[pos]["number_errors"]) + 1;
        }
        
        V[pos]["errors"].push({
            "status":"uncorrected",
            "position": count_errors,
            "uridoc": _uridoc,
            "id_sentence": _urisent,
            "error_detail": msg
        });
        
        V[pos]["number_errors"] = count_errors;
        V[pos]["time"]= new Date().toLocaleTimeString();
        V[pos]["date"]= new Date().toLocaleDateString();
        updateMainTableValidation();
    }
    
    
    sortValues_Sentences_A = function(){
        // searching for sentences without definition
        var toDel = [];
        for (var ind_s in Sentences){
            var sent_ind = Sentences[ind_s];
            if (sent_ind["text"] == undefined){
                addToValidLoad("Error loading sentence <i>"+sent_ind["id_sent"]+"</i> from document <i>"+sent_ind["uridoc"]+"</i>.");
                toDel.unshift(ind_s);
            }
        }
        
        for (del_i in toDel){
           Sentences.splice(toDel[del_i],1); 
        }
        
        
        
        // sorting sentences
        var temp_Sentences = [];
        for (var ind_d in D){
            var oS = sortSentencesOfDoc(ind_d);            
            for (oi in oS){
                temp_Sentences.push(oS[oi]);
            }
        }
        Sentences = temp_Sentences;        
        
        // sorting annotations
        for (_j in A){
            var _a = A[_j];            
            for (_i in Sentences){
                s = Sentences[_i];
                if (s["id_sent"] == _a["urisent"]){
                    A[_j]["id_sentence"] = _i;
                    A[_j]["uridoc"] = s["uridoc"];
                    break;
                }
            }
        }
        
        temp_A = [];
        var overall = 0;
        var uridoc_ = "";
        for (_i in Sentences){
            s = Sentences[_i];
            
            if (s["uridoc"] != uridoc_){
                uridoc_ = s["uridoc"];
                overall = s["text"].length + 1;
            }
            else {
                overall = overall + s["text"].length + 1;
            }
            var oA = getSentencesAnnotations(_i);//sortAnnotationsOfSent(_i);
            for (_j in oA){
                var _a = oA[_j];
                _a["idA"] = temp_A.length;
                _a["ini"] = parseInt(_a["ini"]) + overall - s["text"].length -1;
                _a["fin"] = parseInt(_a["fin"]) + overall - s["text"].length -1;
                temp_A.push(_a);                
            }
        }
        A = temp_A;
    }
    

    
    

    
    textFromUpload = undefined;


    ///------- modify annotation
    //classlabelAnnotation
    //$(".blueLabel").click(function(){
    $('body').on('click', 'span.blueLabel' , function(){
        var ide = $(this).attr("ide");
        if (A.length <= ide){
            warning_alert("Error: there are problems with the identifier of the annotations");
            return 0;
        }
 
        ann = A[ide];
        $("#modalModifyAnnotation-title-desc").val(ann["label"]);
        $("#modalModifyAnnotationLabel").val(ann["label"]);
        


       
        /*$("#modalModifyAnnotationSelectTaxonomy").empty();
        var listInputTaxonomy = $("#taxonomyInput").select2('data');
        select = document.getElementById('modalModifyAnnotationSelectTaxonomy');
        
        //--none first
        var optNone = document.createElement('option');
        optNone.value = 1000;
        optNone.text = "-none-";
        select.add(optNone);
        
        //others
        if (listInputTaxonomy.length != 0){
            for (i in listInputTaxonomy){
                v = listInputTaxonomy[i];
                var option = document.createElement('option');
                option.value = i;
                option.text = v["text"];
                select.add(option);
            }
        }*/  

        //$("#modalModifyAnnotationSelectURI").val(ann["uri"]);
        remove_input_uris();
        $("#modalModifyAnnotationSelectURI").val("");
        $("#modalModifyAnnotationSelectURI").attr("mentiontype","- Select Type -");
        $("#btn_type_modalModifyAnnotationSelectURI").html("- Select Type -");
        for (k in ann["uri"]){
            var text = ann["uri"][k];
            
            var text_type = "- Select Type -";
            var mtype = "- Select Type -";
            var ttyp = link2type[text];            
            if (ttyp != undefined){
                mtype = type2w[ttyp];
                if (mtype != undefined){
                    text_type = '<i class="glyphicon '+type2icon[ttyp]+'"></i>'+mtype;
                    console.log("\n////////////////////\n text:",text,"    ttyp: ",ttyp,"    mtype:",mtype);
                }
                
            }

            var html ='<div class="control-group input-group taIdentRefContainer" style="margin-top:10px">'+
                      '<input id="annotation_'+k+'" mentiontype="'+mtype+'" value="'+text+'" type="text" name="addmore[]" class="form-control taIdentRef" placeholder="Link of the selected entity mention">'+
                      '<div class="input-group-btn"> '+
                          '<button id="btn_type_annotation_'+k+'" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-    haspopup="true" aria-expanded="false">'+ text_type+
                          '</button>'+
                          '<div class="dropdown-menu">'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+k+'\',\'- Select Type -\');" class="dropdown-item">- Select Type -</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+k+'\',\'PERSON\');" class="dropdown-item"><i class="glyphicon glyphicon-user"></i> PERSON</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+k+'\',\'ORG\');" class="dropdown-item"><i class="glyphicon glyphicon-briefcase"></i> ORG</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+k+'\',\'PLACE\');" class="dropdown-item"><i class="glyphicon glyphicon-map-marker"></i> PLACE</a>'+
                          '    <div class="dropdown-divider"></div>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+k+'\',\'MISC\');" class="dropdown-item"><i class="glyphicon glyphicon-tag"></i> MISC</a>'+
                          '</div>'+
                          '<button class="btn btn-info link" type="button" onclick="window.open(\''+text+'\',\'_blank\')"><i class="glyphicon glyphicon-link"></i>Link</button>'+
                          '<button class="btn btn-danger remove" type="button"><i class="glyphicon glyphicon-remove"></i> Remove</button>'+
                      '</div>'+
                   '</div>';
          
          $(".after-add-more-modification").after(html);
          //$("#annotation_"+k).val(text);
        }
        $("#modalModifyAnnotationSelectURI").attr("number",ann["uri"].length+1);
        
         
        
        if ("tag" in ann){
            console.log("----A-----");
            $('#taxonomyMod').val('').trigger("change");
            var ids = []; //[{id: 21, text: "newTax"} .. ]
            for (tt in ann["tag"]){
                var ttag = ann["tag"][tt];
                console.log("--> "+ttag);
                
                if (tax2id[ttag] != undefined){
                    ids.push({"id":tax2id[ttag], "text":ttag});
                    console.log("=>");
                }
                else{
                    console.log("....");
                    var ll = Object.keys(tax2id).length;
                    var newOption = new Option(ttag, ll, true, true);
                    console.log(newOption)
                    $('#taxonomyMod').append(newOption);
                    $('#taxonomyMod').trigger('change');
                    //$("#taxonomyInput").select2('data', {id: ll, text: ttag});  
                    ids.push({"id":ll, "text":ttag});
                    tax2id[ttag] = ll; 
                    console.log(tax2id);
                }
                
            }
            //$("#taxonomyInput").val(ids).change();
            $("#taxonomyMod").select2('data',ids);
        }
        else{
            console.log("Nothing!!");
            $('#taxonomyMod').val('').trigger("change");
        }
        
        //---
        if ("comment" in ann){
            $("#commentMod").val(ann["comment"]);
        }
        else{
            $("#commentMod").val("");
        }
        
        

        //$("#a_link").attr("href",ann["uri"]);
        $("#btn_delete_ann").attr("ide",ide);

        $("#btn_modify").attr("ide",ide);
        $("#btn_modify").attr("surfaceform",ann["label"]);

        /*$("#btn_modify_this_doc").attr("ide",ide);
        $("#btn_modify_this_doc").attr("surfaceform",ann["label"]);

        $("#btn_modify_all_doc").attr("ide",ide);
        $("#btn_modify_all_doc").attr("surfaceform",ann["label"]);*/

        $("#modalModifyAnnotation").modal("show");
    });
    
    restar_idA_in_Annotations = function(){
      for (i in A){
            a = A[i];
            a["idA"] = i;
        }
    }

    $("#btn_delete_ann").click(function(){
        var ide = $(this).attr("ide");
        A.splice(ide,1);
        //console.log("1");
        restar_idA_in_Annotations();
        //console.log("2");
        buildNIFCorpora(); 
        //console.log("3");
        remove_input_uris();
        //console.log("4");
    });
    
    
    // return the sums of the lenths of the sentences before to the senteces with identifier ids
    offset_sentence = function(ids,urldoc){
      var l = 0;
      for (var i in Sentences){
          if(Sentences[i]["uridoc"] != urldoc){continue;}
          sent = Sentences[i]["text"];
          if (i < ids){
              l = l + sent.length +1;
          }
      }
      return l;
    }
    
    
    $(".add-more-modification").click(function(){ 
          var id = $("#modalModifyAnnotationSelectURI").attr("number");
          var mtype = $("#modalModifyAnnotationSelectURI").attr("mentiontype");
          var text_type = "- Select Type -";
          if (mtype != text_type){
              var ttyp = w2type[mtype];
              if  ( ttyp != undefined){
                  text_type = '<i class="glyphicon '+type2icon[ttyp]+'"></i>'+mtype;
              }
          }

          var text = $("#modalModifyAnnotationSelectURI").val();
          var html ='<div class="control-group input-group taIdentRefContainer" style="margin-top:10px">'+
                      '<input id="annotation_'+id+'" mentiontype="'+mtype+'" type="text" name="addmore[]" class="form-control taIdentRef" placeholder="Link of the selected entity mention">'+
                      '<div class="input-group-btn"> '+
                          '<button id="btn_type_annotation_'+id+'" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-    haspopup="true" aria-expanded="false">'+ text_type+
                          '</button>'+
                          '<div class="dropdown-menu">'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'- Select Type -\');" class="dropdown-item">- Select Type -</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'PERSON\');" class="dropdown-item"><i class="glyphicon glyphicon-user"></i> PERSON</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'ORG\');" class="dropdown-item"><i class="glyphicon glyphicon-briefcase"></i> ORG</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'PLACE\');" class="dropdown-item"><i class="glyphicon glyphicon-map-marker"></i> PLACE</a>'+
                          '    <div href="javascript:dropdown-divider"></div>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'MISC\');" class="dropdown-item"><i class="glyphicon glyphicon-tag"></i> MISC</a>'+
                          '</div>'+
                          '<button class="btn btn-info link" type="button" onclick="window.open(\''+text+'\',\'_blank\')"><i class="glyphicon glyphicon-link"></i>Link</button>'+
                          '<button class="btn btn-danger remove" type="button"><i class="glyphicon glyphicon-remove"></i> Remove</button>'+
                      '</div>'+
                   '</div>';
          
          
          $(".after-add-more-modification").after(html);

          
          $("#annotation_"+id).val(text);
          $("#modalModifyAnnotationSelectURI").attr("number",parseInt(id)+1);
          $("#modalModifyAnnotationSelectURI").val("");
          $("#modalModifyAnnotationSelectURI").attr("mentiontype","- Select Type -");
          $("#btn_type_modalModifyAnnotationSelectURI").html("- Select Type -");
          $("#modalModifyAnnotationSelectURI").focus();

      });

    
    
    update_all_sentences_all_documents = function(){
        //console.log("aqui");
        var text = "";
        var lastDoc = "";
        for (i in Sentences){
            if (lastDoc != "" && lastDoc!=Sentences[i]["uridoc"]){
                inDocCounter = uri2inDocCounter(lastDoc);
                //console.log("1-->"+inDocCounter);
                $("#inDoc"+inDocCounter).val(text);
                text = "";
            }
            lastDoc = Sentences[i]["uridoc"];
            s = Sentences[i]["text"];
            text= text  + s + "\n";
        }

        n = text.length;
        /////$("#inDoc").val(text);
        inDocCounter = uri2inDocCounter(lastDoc);
        //console.log("2-->"+inDocCounter);
        $("#inDoc"+inDocCounter).val(text);
    }
    

    $("#btn_modify").click(function(){
        var ide = $(this).attr("ide");
            var list_uri = [];
            $('.taIdentRef').each(function() {
                var text = $(this).val();
                if (text!=""){
                    list_uri.push(text);
                }
                
                // -- added
                //if (link2type[text] == undefined){
                    var typeMention = $(this).attr("mentiontype");
                    if (typeMention != '- Select Type -'){
                        link2type[text] = w2type[typeMention];
                        console.log("uri:",text,"   w2type[typeMention]:",w2type[typeMention],"   typeMention:",typeMention);
                    }
                    else {
                        delete link2type[text];
                    }
                //}
                
            });

            /*  OJOOOOOOO */
            var in_uri = $("#modalModifyAnnotationSelectURI").val();
            if (in_uri){
                list_uri.push(in_uri);
                var typeMention = $("#modalModifyAnnotationSelectURI").attr("mentiontype");
                if (typeMention != '- Select Type -' ){
                    link2type[in_uri] = w2type[typeMention];
                    //console.log("in_uri:",in_uri,"   w2type[typeMention]:",w2type[typeMention],"    typeMention:",typeMention);
                }
            }
            
               
            if (list_uri.length == 0){
                warning_alert("Debe de entrar una URI");
                return 0;
            }
            
            A[ide]["uri"] = list_uri;
 

            var list_tag = [];
            var listInputTaxonomy = $("#taxonomyMod").select2('data');        
            if (listInputTaxonomy.length != 0){
                for (i in listInputTaxonomy){
                    var v = listInputTaxonomy[i];
                    list_tag.push(v["text"])
                }
                A[ide]["tag"] = list_tag;
            } 
            else{
                delete A[ide]["tag"];
            }
            
            
            // comment
            var comment = $("#commentMod").val();
            if (comment != undefined && comment.length >0){
                A[ide]["comment"] = comment;
            }
            else{
                delete A[ide]["comment"];
            }

            
            //surface form
            var ann_label = $("#modalModifyAnnotationLabel").val();
            var btn_label = $("#btn_modify").attr("surfaceform");
            if (ann_label != btn_label){
                
                // actualizo esta anotacion --------
                var ids = parseInt(A[ide]["id_sentence"]);
                var slength = Sentences[ids]["text"].length;
                var lbeforeToS = offset_sentence(ids,A[ide]["uridoc"]);
                var sini = A[ide]["ini"] - lbeforeToS;
                var sfin = A[ide]["fin"] - lbeforeToS;
                var new_s = Sentences[ids]["text"].substr(0,sini) +ann_label+ Sentences[ids]["text"].substr(sfin,slength);
                Sentences[ids]["text"] = new_s;
                urldoc = Sentences[ids]["uridoc"];
                A[ide]["fin"] = A[ide]["ini"] + ann_label.length;
                A[ide]["label"] = ann_label;
                
                // actualizo los ids de las annotaciones de esta misma oracion que ocurren luego de ellas ------
                var delta = ann_label.length - btn_label.length;
                for (k in A){
                    ann = A[k];
                    if (ann["uridoc"] != urldoc){
                        continue;
                    }
                    //if (ann["id_sentence"]>A[ide]["id_sentence"]  ||  (ann["id_sentence"]==A[ide]["id_sentence"] && ann["ini"]>A[ide]["ini"])){
                    if (ann["ini"]>A[ide]["ini"]){
                        ann["ini"] = ann["ini"] + delta;
                        ann["fin"] = ann["fin"] + delta;
                    }
                }
                
                // actualizo el inDoc --------
                update_all_sentences_all_documents();
                /*
                var text = "";
                for (i in Sentences){
                    s = Sentences[i]["text"];
                    text= text  + s + "\n";
                }
                n = text.length;
                $("#inDoc").val(text);*/
            }
        //}
        $("#nifdoc").val("");
        buildNIFCorpora(); 
        $('#modalModifyAnnotation').modal("hide"); 
        remove_input_uris();
    });
    

    $('ul.tabs li').click(function(){
        var tab_id = $(this).attr('data-tab');

        $('ul.tabs li').removeClass('current');
        $('.tab-content').removeClass('current');

        $(this).addClass('current');
        $("#"+tab_id).addClass('current');
    })
    
    
    
    //---- annotation modal, add multiannotations
    $(".add-more").click(function(){ 
          ///var html = $(".copy").html();
          ///console.log(html);
          var id = $("#modalSelectURI").attr("number");
          var mtype = $("#modalSelectURI").attr("mentiontype");
          var text_type = "- Select Type -";
          if (mtype != text_type){
              var ttyp = w2type[mtype];
              if  ( ttyp != undefined){
                  text_type = '<i class="glyphicon '+type2icon[ttyp]+'"></i>'+mtype;
              }
          }
          var html ='<div class="control-group input-group taIdentRefContainer" style="margin-top:10px">'+
                      '<input id="annotation_'+id+'" mentiontype="'+mtype+'" type="text" name="addmore[]" class="form-control taIdentRef" placeholder="Link of the selected entity mention">'+
                      '<div class="input-group-btn"> '+
                          '<button id="btn_type_annotation_'+id+'" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-    haspopup="true" aria-expanded="false">'+ text_type+
                          '</button>'+
                          '<div class="dropdown-menu">'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'- Select Type -\');" class="dropdown-item">- Select Type -</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'PERSON\');" class="dropdown-item"><i class="glyphicon glyphicon-user"></i> PERSON</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'ORG\');" class="dropdown-item"><i class="glyphicon glyphicon-briefcase"></i> ORG</a>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'PLACE\');" class="dropdown-item"><i class="glyphicon glyphicon-map-marker"></i> PLACE</a>'+
                          '    <div class="dropdown-divider"></div>'+
                          '    <a href="javascript:dropdown_action(\'annotation_'+id+'\',\'MISC\');" class="dropdown-item"><i class="glyphicon glyphicon-tag"></i> MISC</a>'+
                          '</div>'+
                          
                          '<button class="btn btn-danger remove" type="button"><i class="glyphicon glyphicon-remove"></i> Remove</button>'+
                      '</div>'+
                   '</div>';
          
          $(".after-add-more").after(html);

          var text = $("#modalSelectURI").val();
          $("#annotation_"+id).val(text);
          $("#modalSelectURI").attr("number",parseInt(id)+1);
          $("#modalSelectURI").val("");
          $("#btn_type_modalSelectURI").html("- Select Type -");
          $("#modalSelectURI").attr("mentiontype","- Select Type -");
          $("#modalSelectURI").focus();

      });

      $("body").on("click",".remove",function(){ 
          $(this).parents(".control-group").remove();
      });
    
    
    // checking varibles
    /*$_GET=[];
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(a,name,value){$_GET[name]=value;});
    
    function processFiles(file) {
        //var file = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            // Cuando éste evento se dispara, los datos están ya disponibles.
            // Se trata de copiarlos a una área <div> en la página.
            var output = document.getElementById("inDoc"); 
            output.textContent = e.target.result;
        };
        reader.readAsText(file);
    }*/
    
    
    
    //------ remove all tags
    $("#removeTaxonomy").click(function(){
      BootstrapDialog.show({
            title: 'Erasing all the Tags',
            message: 'Are you sure that you want to delete all the tags in the annotations? This process is irreversible.',
            buttons: [{
                cssClass: 'btn-primary',
                label: 'Yes',
                action: function(dialog) {
                    delete_all_tags();
                    dialog.close();
                }
            }, {
                label: 'No',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
    });
    
    
    delete_all_tags = function(){
      for (i in A){
          a = A[i];
          if ("tag" in a){
              delete a["tag"];
          }
      }
      buildNIFCorpora();
      $('#taxonomyInput').val('').trigger("change");
    }
    
    
    //---- automatically annotate previous annotations from dictionaries
    //Dictionary = [{"label":"henry", "annotations":["https://es.wikipedia.org/wiki/Joseph_Henry","https://es.wikipedia.org/wiki/Thierry_Henry"]}];
    $("#btn_4_annotation").click(function(){
      BootstrapDialog.show({
            title: 'Automatic Annotations',
            message: 'Are you sure you want to add the automatic annotations?',
            buttons: [{
                cssClass: 'btn-primary',
                label: 'Yes',
                action: function(dialog) {
                    automatic_annotations();
                    dialog.close();
                }
            }, {
                label: 'No',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
    });
    
    
    // find if there is annotated the mention started by "ini" until  "fin"
    notAnnotatedYet = function(ini,fin,udoc){
      for (k in A){
          var ann = A[k];
          if (ann["ini"] == ini && ann["fin"] == fin && ann["uridoc"]==udoc){
              return k; // it's already annotated
          }
      }
      return -1;
    }

    /*ExistOverlapp = function(ini1,fin1,ini,fin){
        if (!(    ( (ini1<ini && ini1<fin) && (fin1<ini && fin1<fin) )   ||   ( (ini<ini1 && ini<fin1) && (fin<ini1 && fin<fin1) )  )){
                return true;
        }
        return false;
    }*/


    
    // Perfom the automatic annotations
    var punctuationsSign = {" ":"", "\n":"", ".":"", ",":"", ";":"", "-":"","'":"", '"':"", "”":"", ")":"", "(":"", "[":"", "]":"", "<":"", ">":""};
    automatic_annotations = function(){
      
     for (d in D){
      doc = D[d];
      _inDocCounter = doc["inDocCounter"];
      var text = $("#inDoc"+_inDocCounter).val();
      //console.log(text)
      
      for(i in Dictionary){
          var d = Dictionary[i];
          var t = d["label"];
          var t_len = t.length;
          var txt = text;
          var p = txt.indexOf(t);
          var overall = 0;
          while (p!=-1){
              var ini = overall + p;
              var fin = overall + p + t_len;
              //var posInA = notAnnotatedYet(ini,fin);
              if (!existsOverlapping({"ini":ini, "fin":fin, "uridoc":doc["uri"]})){
              //if (posInA == -1){ 
                  if ( (p==0 || txt[p-1] in punctuationsSign) && (p+t_len==txt.length || txt[p+t_len] in punctuationsSign) ){
                      var ids = sent2id(ini,_inDocCounter);
                      A.push({
                          "ini":ini, 
                          "fin":fin, 
                          "uri":d["annotations"], 
                          "id_sentence": ids,
                          "uridoc":doc["uri"],
                          //"uridoc": Sentences[ids]["uridoc"],
                          "label":t
                      });
                  }

              }
              else{ // I will add the missing annotations
                  /*var U = A[posInA]["uri"];
                  for (t in U){
                      u = U[t];
                      if ($.inArray(u,U) == -1){
                          A[posInA]["uri"].push(u);
                      }
                  }*/
              }
              overall = fin;
              var temp_txt = txt.substr(p + t_len,txt.lenth);
              txt = temp_txt;
              p = txt.indexOf(t);
          }
      }
     }
     restar_idA_in_Annotations();
     buildNIFCorpora(); 
    }
    
    //--- Review
    $("#btn_review").click(function(){
      
        if ('Blob' in window) {
	  BootstrapDialog.show({
            message: '<label for="filename_input" class="col-form-label">File Name:</label> ' +
                     '<input type="text" class="form-control espacioAbajo" id="filename_input" '+
                     'placeholder="Name of the file">',
            title: 'Saving file with annotations',
            buttons: [{
                label: 'Close',
                action: function(dialog) {
                    dialog.close();
                }
            }, {
                label: 'Ok',
                action: function(dialog) {
                    var fileName = $("#filename_input").val();
                    var Text = "";
        
                    $('span').each(function() {
                        var ide = $(this).attr("ide");
                        if (ide && ide!=""){
                            var a = A[ide];
                            $(this).html("("+ide+")"+$(this).html());
                            Text = Text + "------------------------["+A[ide]["label"]+"]\n";
                            Text = Text + "(" + ide + ")  ";
                            var first = true;
                            for (j in a["uri"]){
                                var t = a["uri"][j];
                                var l_ = "";
                                var t_ = link2type[t];
                                console.log("t_ --->>> ",t_);
                                if (t_!=undefined){
                                    l_ = " ["+type2w[t_]+"]";
                                }                                
                                if (first){
                                    var len = ide.length;
                                    var prefix_s = "";
                                    for (var k = len; k <4; k++) {
                                        prefix_s = prefix_s + " ";
                                    }
                                    Text = Text +prefix_s+t+l_+"\n";
                                }
                                else {
                                    Text = Text +"        "+t+l_+"\n";
                                }
                                first = false;
                            }
                            
                            
                            //---
                            Text = Text + ".... "
                            var first = true;
                            for (j in a["tag"]){
                                var t = a["tag"][j];
                                if (first){
                                    var len = ide.length;
                                    var prefix_s = "";
                                    for (var k = len; k <4; k++) {
                                        prefix_s = prefix_s + " ";
                                    }
                                    Text = Text +prefix_s+t+"\n";
                                }
                                else {
                                    Text = Text +"        "+t+"\n";
                                }
                                first = false;
                            }
                            //---
                            
                            
                        }
                    });

        
        
                    var textToWrite = Encoder.htmlDecode(replaceAll(Text,"<br>","\n"));
                    var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
                    if ('msSaveOrOpenBlob' in navigator) {
                        navigator.msSaveOrOpenBlob(textFileAsBlob, fileName);
                    } else {
                        var downloadLink = document.createElement('a');
                        downloadLink.download = fileName;
                        downloadLink.innerHTML = 'Download File';
                        if ('webkitURL' in window) {
                            // Chrome allows the link to be clicked without actually adding it to the DOM.
                            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                        } else {
                            // Firefox requires the link to be added to the DOM before it can be clicked.
                            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                            downloadLink.onclick = function(){};
                            downloadLink.style.display = 'none';
                            document.body.appendChild(downloadLink);
                        }
                        downloadLink.click();
                    }
                    dialog.close();
                }
            }]
        });

        } else {
            alert('Your browser does not support the HTML5 Blob.');
        }


        
    });
    
    
    
    //----- showing/hiding NIF code section
    bNifPanelShowed = false;
    $("#btn_hideNIF").click(function(){
        if (bNifPanelShowed){
            bNifPanelShowed = false;
            $("#nifdoc").addClass("hide")
            $("#DisplayBlock").removeClass("col-lg-6");
            $("#DisplayBlock").addClass("col-lg-12");
            
            $(this).addClass("btn-primary");
            $(this).removeClass("btn-info");
        } else{
            bNifPanelShowed = true;
            $("#nifdoc").removeClass("hide");
            $("#DisplayBlock").removeClass("col-lg-12");
            $("#DisplayBlock").addClass("col-lg-6");

            $(this).removeClass("btn-primary");
            $(this).addClass("btn-info");
        }
    });
    
    
    
    
    
    //----------------- convert ACE to NIF
    $("#btn_ace2nif").click(function(){
        var text = $("#ace_inDoc_struct").val();
        var urldoc = $("#ace_inIdDoc").val();
        if (!urldoc){
            var p1 = text.indexOf("<ReferenceFileName>");
            var p2 = text.indexOf("</ReferenceFileName>");
            if (p1!=-1){
                p1 = p1 + 19;
                urldoc = "http://ace2004/dataset/" + text.substring(p1,p2).trim();
                console.log(urldoc);
            }
            else{
                urldoc = "https://example.org/doc"+inDocCounter;
            }
        }
        D.push({"uri":urldoc, "inDocCounter":inDocCounter});

        
        
        
        //Extracting the annotations first
        tempA = [];
        var p1 = text.indexOf("<SurfaceForm>");
        while (p1 != -1){
            //--- label
            p1 = p1 + 13;
            var p2 = text.indexOf("</SurfaceForm>");
            var label_raw = text.substring(p1,p2);
            label = label_raw.trim();
            //console.log(label)

            //--- ini
            var p1 = text.indexOf("<Offset>");
            p1 = p1 + 8;
            var p2 = text.indexOf("</Offset>");
            var ini_raw = text.substring(p1,p2);
            ini = parseInt(ini_raw.trim());
            //console.log(ini)

            //--- fin
            var p1 = text.indexOf("<Length>");
            p1 = p1 + 8;
            var p2 = text.indexOf("</Length>");
            var fin_raw = text.substring(p1,p2);
            fin = parseInt(fin_raw.trim())+ini;
            //onsole.log(fin)

            //--- link
            var p1 = text.indexOf("<ChosenAnnotation>");
            p1 = p1 + 18;
            var p2 = text.indexOf("</ChosenAnnotation>");
            var link_raw = text.substring(p1,p2);
            link = link_raw.trim();
            if (link == "*null*"){
                link = "https://en.wikipedia.org/wiki/NotInLexico";
            }
            //console.log(link)
            //console.log("----------");
            tempA.push({
                "ini":ini, 
                "fin":fin, 
                "uri":[link], 
                //"id_sentence": ids,
                "uridoc": urldoc,
                "label":label
            });

            text = text.substring(p2+13,text.length);
            var p1 = text.indexOf("<SurfaceForm>");
        }
        
        
        //Spliting the text in sentences
        
        text = $("#ace_inDoc_raw").val();
        //var p1 = text.indexOf("   ");
        overall = 0;
        nsent = 0;
        while (text!=""){ 
            var p1 = text.indexOf("   ");
            if (p1 == -1){
                p1 = text.length;            
            }
            sent = text.substring(0,p1)
            console.log(sent);
            
            //Adding this sentences and annotations to the main tab
            ids = Sentences.length;
            Sentences.push({"text":sent,"uridoc":urldoc});
            for (i in tempA){
                ann = tempA[i];
                if (ann["ini"]>overall && ann["ini"]<overall + sent.length){
                    ann["id_sentence"] = ids;
                    ann["idA"] = A.length;
                    ann["ini"] = ann["ini"] - 2*nsent;
                    ann["fin"] = ann["fin"] - 2*nsent;
                    A.push(ann);
                }
                
            }
            
            text = text.substring(p1,text.length);
            text = text.trim();
            overall = overall + sent.length + 2;
            nsent = nsent + 1;
        }
        

        
        inDocCounter = inDocCounter + 1;
        buildNIFCorpora();

        //-- cleaning the inputs
        $("#ace_inDoc_struct").val("");
        $("#ace_inDoc_raw").val("");
        $("#ace_inIdDoc").val("");


        // --- move to the NIF tab
        $('ul.tabs li').removeClass('current');
        $('.tab-content').removeClass('current');

        $("#docli").addClass('current');
        $("#doc").addClass('current');
    });






    //----------------- convert msnbc to NIF
    $("#btn_msnbc2nif").click(function(){
        var text = $("#msnbc_inDoc_struct").val();
        var urldoc = $("#msnbc_inIdDoc").val();
        if (!urldoc){
            var p1 = text.indexOf("<ReferenceFileName>");
            var p2 = text.indexOf("</ReferenceFileName>");
            if (p1!=-1){
                p1 = p1 + 19;
                urldoc = "http://msnbc/dataset/" + text.substring(p1,p2).trim();
                console.log(urldoc);
            }
            else{
                urldoc = "https://example.org/doc"+inDocCounter;
            }
        }
        D.push({"uri":urldoc, "inDocCounter":inDocCounter});

        
        
        
        //Extracting the annotations first
        tempA = [];
        var p1 = text.indexOf("<SurfaceForm>");
        while (p1 != -1){
            //--- label
            p1 = p1 + 13;
            var p2 = text.indexOf("</SurfaceForm>");
            var label_raw = text.substring(p1,p2);
            label = label_raw.trim();
            //console.log(label)

            //--- ini
            var p1 = text.indexOf("<Offset>");
            p1 = p1 + 8;
            var p2 = text.indexOf("</Offset>");
            var ini_raw = text.substring(p1,p2);
            ini = parseInt(ini_raw.trim());
            //console.log(ini)

            //--- fin
            var p1 = text.indexOf("<Length>");
            p1 = p1 + 8;
            var p2 = text.indexOf("</Length>");
            var fin_raw = text.substring(p1,p2);
            fin = parseInt(fin_raw.trim())+ini;
            //onsole.log(fin)

            //--- link
            var p1 = text.indexOf("<ChosenAnnotation>");
            p1 = p1 + 18;
            var p2 = text.indexOf("</ChosenAnnotation>");
            var link_raw = text.substring(p1,p2);
            link = link_raw.trim();
            if (link == "*null*"){
                link = "https://en.wikipedia.org/wiki/NotInLexico";
            }
            //console.log(link)
            //console.log("----------");
            tempA.push({
                "ini":ini, 
                "fin":fin, 
                "uri":[link], 
                //"id_sentence": ids,
                "uridoc": urldoc,
                "label":label
            });

            text = text.substring(p2+13,text.length);
            var p1 = text.indexOf("<SurfaceForm>");
        }
        
        
        //Spliting the text in sentences
        
        text = $("#msnbc_inDoc_raw").val();
        //var p1 = text.indexOf("   ");
        overall = 0;
        nsent = 0;
        while (text!=""){ 
            var p1 = text.indexOf("\n");
            if (p1 == -1){
                p1 = text.length;            
            }
            sent = text.substring(0,p1)
            console.log(sent);
            
            //Adding this sentences and annotations to the main tab
            ids = Sentences.length;
            Sentences.push({"text":sent,"uridoc":urldoc});
            for (i in tempA){
                ann = tempA[i];
                if (ann["ini"]>overall && ann["ini"]<overall + sent.length){
                    ann["id_sentence"] = ids;
                    ann["idA"] = A.length;
                    ann["ini"] = ann["ini"] - 2*nsent;
                    ann["fin"] = ann["fin"] - 2*nsent;
                    A.push(ann);
                }
                
            }
            
            text = text.substring(p1,text.length);
            text = text.trim();
            overall = overall + sent.length + 2;
            nsent = nsent + 1;
        }
        

        
        inDocCounter = inDocCounter + 1;
        buildNIFCorpora();

        //-- cleaning the inputs
        $("#msnbc_inDoc_struct").val("");
        $("#msnbc_inDoc_raw").val("");
        $("#msnbc_inIdDoc").val("");


        // --- move to the NIF tab
        $('ul.tabs li').removeClass('current');
        $('.tab-content').removeClass('current');

        $("#docli").addClass('current');
        $("#doc").addClass('current');
    });
    
    
    
    // ---- deleting document
    deleting_document = function(idc){
        for (d in D){
            doc = D[d];
            //console.log(doc);
            //console.log(doc["inDocCounter"]);
            //console.log(idc);
            if (doc["inDocCounter"] == idc){
                urldoc = doc["uri"];
                D.splice(d,1);
                //for (s in Sentences){
                for (s=Sentences.length-1; s>=0; s--){
                    sent = Sentences[s];
                    if (sent["uridoc"] == urldoc){
                        //console.log("deleting "+s);
                        delete_sentence_yes(s);
                    }
                }
                break;
            }
        }
        buildNIFCorpora();
    }
    
    
    
    deletedoc = function(idc){
      BootstrapDialog.show({
            title: 'Deleting Document',
            message: 'Are you sure you want to delete this document?',
            buttons: [{
                cssClass: 'btn-primary',
                label: 'Yes',
                action: function(dialog) {
                    //var idc = $(this).attr("id");
                    //console.log(idc)
                    deleting_document(idc);
                    dialog.close();
                }
            }, {
                label: 'No',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
    }
    
    
    /*
    //$(document).on('click', '.btn_deldoc', function () {
    $(".btn_deldoc").on("click", function(){
        BootstrapDialog.show({
            title: 'Deleting Document',
            message: 'Are you sure you want to delete this document?',
            buttons: [{
                cssClass: 'btn-primary',
                label: 'Yes',
                action: function(dialog) {
                    var idc = $(this).attr("id");
                    console.log(idc)
                    deleting_document(idc);
                    dialog.close();
                }
            }, {
                label: 'No',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
    });*/
    
    
    
    //---- buttons of types in the modals of annotacion and modification
    //$(".dropdown-item").click(function(){
    /*$(".dropdown-item").on('click', function(){
        
        var id_parent = $(this).attr("mainid");
        var html_= $(this).html();
        $("#btn_type_"+id_parent).html(html_);
        console.log("HTML:"+html_);
        if (html_ != "- Select Type -"){
            $("#"+id_parent).attr("mentiontype",html_.split("i> ")[1]);            
        }
        else{
            $("#"+id_parent).attr("mentiontype","- Select Type -");  
        }
        
    });*/
    
    dropdown_action = function(id_parent, mtype){
        console.log(id_parent, mtype);
        var html_ = "- Select Type -";
        if (mtype != html_){
            var ttyp = w2type[mtype];
            if  ( ttyp != undefined){
                html_ = '<i class="glyphicon '+type2icon[ttyp]+'"></i> '+mtype;
            }
        }
          
        $("#btn_type_"+id_parent).html(html_);
        console.log("antes");
        if (mtype != "- Select Type -"){
            console.log("1",mtype);
            console.log("--->",$("#"+id_parent).attr("mentiontype"),mtype);
            $("#"+id_parent).attr("mentiontype",mtype);            
        }
        else{
            console.log("2");
            $("#"+id_parent).attr("mentiontype","- Select Type -");  
        }
    };
    
    dropdown_main = function(tp){
        var html_ = '<i class="glyphicon glyphicon-minus"></i>';
        if (tp == "None"){
            html_ = '<i class="glyphicon glyphicon-minus"></i>';
        }
        else if (tp == "Top"){
            html_ = '<i class="glyphicon glyphicon-arrow-up"></i>';
        }
        else if (tp == "Bottom"){
            html_ = '<i class="glyphicon glyphicon-arrow-down"></i>';
        }
        else if (tp == "Mix"){
            html_ = '<i class="glyphicon glyphicon-random"></i>';
        }
        
        $('#btn_place_types_entities').html(html_);
        buildNIFCorpora();
        
    };
    
    
    
    
    // -------------------
    // Stressing the pronouns in the text
    
    SingularPronouns = ['his', 'who', 'yourself', 'my', 'your', 'himself', 'everything', 'mine', 'myself', 'me' ,'each', 'yours', 'it', 'itself', 'whose', 'another', 'her', 'which', 'this', 'him', 'you', 'that', 'nobody', 'hers', 'someone', 'whom', 'either', 'its', 'what', 'herself'];
    PluralPronouns = ['who', 'fewer', 'your', 'yours', 'few', 'themselves', 'their', 'they', 'several', 'theirs', 'others', 'these', 'whose', 'yourselves', 'those', 'many', 'which', 'whoever', 'you', 'that', 'them', 'whomever', 'both', 'us', 'whichever', 'ourselves', 'whom', 'we', 'our', 'what'];
    
    
    $("#btn_stress_pronouns").click(function(){
      BootstrapDialog.show({
            title: 'Automatic Annotations',
            message: 'Are you sure you want to add the annotations related to the pronouns?',
            buttons: [{
                cssClass: 'btn-primary',
                label: 'Yes',
                action: function(dialog) {
                    stress_function();
                    dialog.close();
                }
            }, {
                label: 'No',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
    });
    
    
    
    stress_function = function(){
        var both = SingularPronouns.concat(PluralPronouns);
        for (d in D){
            doc = D[d];
            _inDocCounter = doc["inDocCounter"];
            var text = $("#inDoc"+_inDocCounter).val();
            //console.log(text)
            
            for(i in both){
                var t = both[i];
                var plurality = "mnt:SingularNounPoS";
                if (PluralPronouns.indexOf(t) != -1){
                    plurality = "mnt:PluralNounPoS";
                }
                
                //var t = d["label"];
                var t_len = t.length;
                var txt = text;
                var p = txt.indexOf(t);
                var overall = 0;
                while (p!=-1){
                    var ini = overall + p;
                    var fin = overall + p + t_len;
                    //var posInA = notAnnotatedYet(ini,fin);
                    if (!existsOverlapping({"ini":ini, "fin":fin, "uridoc":doc["uri"]})){
                    //if (posInA == -1){ 
                        if ( (p==0 || txt[p-1] in punctuationsSign) && (p+t_len==txt.length || txt[p+t_len] in punctuationsSign) ){
                            var ids = sent2id(ini,_inDocCounter);
                            A.push({
                                "ini":ini, 
                                "fin":fin, 
                                "uri":["https://en.wikipedia.org/wiki/NotInLexico"], 
                                "id_sentence": ids,
                                "tag": ["mnt:Pro-formPN", plurality, "mnt:CoreferenceRf", "mnt:Non-Overlapping", "mnt:LiteralRh","tax:Ambiguous"],
                                "uridoc":doc["uri"],
                                //"uridoc": Sentences[ids]["uridoc"],
                                "label":t
                            });
                        }

                    }
                    else{ // I will add the missing annotations
                        /*var U = A[posInA]["uri"];
                        for (t in U){
                            u = U[t];
                            if ($.inArray(u,U) == -1){
                                A[posInA]["uri"].push(u);
                            }
                        }*/
                    }
                    overall = fin;
                    var temp_txt = txt.substr(p + t_len,txt.lenth);
                    txt = temp_txt;
                    p = txt.indexOf(t);
                }
            }
        }
        restar_idA_in_Annotations();
        buildNIFCorpora(); 
    };
    
    
    
    
    
    
    
    /// ---- filtering tags
    $("#filterTaxonomy").click(function(){
        var state = $("#filterTaxonomy").attr("state");
        if (state == "Off"){
            BootstrapDialog.show({
                title: 'Applying filters',
                message: 'Are you sure that you want to apply the filter? In that way, only the annotations that match with them will be displayed in the visualization area and in the NIF format.',
                buttons: [{
                    cssClass: 'btn-primary',
                    label: 'Yes',
                    action: function(dialog) {
                        apply_filter();
                        dialog.close();
                    }
                }, {
                    label: 'No',
                    action: function(dialog) {
                        dialog.close();
                    }
                }]
            });
        }
        else {
            BootstrapDialog.show({
                title: 'Removing filters',
                message: 'Are you sure that you want to remove the filter? In that way, all the annotations will be displayed in the visualization area and in the NIF format.',
                buttons: [{
                    cssClass: 'btn-primary',
                    label: 'Yes',
                    action: function(dialog) {
                        remove_filter();
                        dialog.close();
                    }
                }, {
                    label: 'No',
                    action: function(dialog) {
                        dialog.close();
                    }
                }]
            });
        }
        
    });
    
    
    apply_filter = function(){
        var newstate = "On";
        $("#iconfilter").addClass("text-primary");
        $("#filterTaxonomy").attr("state",newstate);
        //_filter = ["mnt:LiteralRh"];
        _filter = [];
        var listInputTaxonomy = $("#taxonomyInput").select2('data'); //devuelve algo asi [{…}, {…}]
                                                                 //                   0: {id: 2, text: "nerd:Airline"},
                                                                 //                   1: {id: "ddd", text: "ddd"}
        for (i in listInputTaxonomy){
            t = listInputTaxonomy[i];
            _filter.push(t["text"]);            
        }
        buildNIFCorpora();
    }
    
    
    remove_filter = function(){
        var newstate = "Off";
        $("#filterTaxonomy").attr("state",newstate);
        $("#iconfilter").removeClass("text-primary");
        
        _filter = [];
        buildNIFCorpora();
    }
    
    $("#cleanTaxonomy").click(function(){
        $('#taxonomyInput').val('').trigger("change");
    });
    
    
    
    //--------------------
    // Boton para resaltar numeros
    $("#btn_stress_numbers").click(function(){
        BootstrapDialog.show({
            title: 'Stressing number in the text',
            message: 'Are you sure that you want to automatically annotate the numbers?',
            buttons: [{
                cssClass: 'btn-primary',
                label: 'Yes',
                action: function(dialog) {
                    adding_tags_numbers();
                    dialog.close();
                }
            }, {
                label: 'No',
                action: function(dialog) {
                    dialog.close();
                }
            }]
        });
    });
    
    //dado un texto y una posicion identifica el largo del númeero que empieza en esa posicion en el texto
    // y devuelve posición inicial y final, y el numero en si
    pos_and_number = function(s,p){
        var i = 0;
        var label = "";
        while (i+p<s.length && (
            s[i+p] == "0" || s[i+p] == "1" || s[i+p] == "2" || s[i+p] == "3" || s[i+p] == "4" ||
            s[i+p] == "5" || s[i+p] == "6" || s[i+p] == "7" || s[i+p] == "8" || s[i+p] == "9" || s[i+p] == ","
        )  ){
            label = label + s[i+p];
            i = i + 1;            
        }
        
        return {"ini":p, "fin":i+p, "label":label};
    }
    
    //https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Regular_Expressions
    adding_tags_numbers = function(){
        /*
        var regex = /\s[1234567890]*\s/g;
        var par = "Esto es 1 una 2 623 prueba";
        var myArray = par.search(regex);
        //var myArray = regex.search ( "Esto es 1 una 2 623 prueba");
        console.log(myArray);
        //console.log ( "El valor de lastIndex es" + regex.lastIndex);
        */
        
        var re = /\s([0-9]+[,]?[0-9])+\s/g ;  // /\d+\s/g;
        for (d in D){
            doc = D[d];
            _inDocCounter = doc["inDocCounter"];
            var text = $("#inDoc"+_inDocCounter).val();
            
            
            while ((match = re.exec(text)) != null) {
                console.log(match.index);
                var pos = match.index +1;
                var p_n = pos_and_number(text,pos);
                var ids = sent2id(pos,_inDocCounter);
                var plurality = "mnt:PluralNounPoS";
                if (p_n["label"] == "1"){plurality = "mnt:SingularNounPoS";}
                console.log(doc["uri"]);
                var notYet = notAnnotatedYet(p_n["ini"],p_n["fin"],doc["uri"]);
                console.log("notYet");
                console.log(notYet);
                if (notYet == -1){
                    A.push({
                        "ini":p_n["ini"],//ini, 
                        "fin":p_n["fin"],//fin, 
                        "uri":["https://en.wikipedia.org/wiki/"+p_n["label"]],//NotInLexico"], 
                        "id_sentence": ids,
                        "tag": ["mnt:NumericTemporalPN", plurality, "mnt:AntecedentRf", "mnt:Non-Overlapping", "mnt:LiteralRh","tax:Ambiguous"],
                        "uridoc":doc["uri"],
                        //"uridoc": Sentences[ids]["uridoc"],
                        "label":p_n["label"]
                    });
                }
                
            }
        }
        restar_idA_in_Annotations();
        buildNIFCorpora(); 
        //remove_input_uris();
    }
    
    
    //--------------------
    //--- Summary button
    
    $("#btn_summary").click(function(){
        $("#sry_table").empty();
        
        var html_table = '<thead>'+
            '<tr>'+
                '<th scope="col">#</th>'+
                '<th scope="col">Attribute</th>'+
                '<th scope="col">Total</th>'+
                '<th scope="col">Avg. by doc</th>'+
            '</tr>'+
        '</thead>'+
        '<tbody>'+
            '<tr>'+
                '<th scope="row">1</th>'+
                '<td>Documentos</td>'+
                '<td id="sry_doc">0</td>'+
                '<td>-</td>'+
            '</tr>'+
            '<tr>'+
                '<th scope="row">2</th>'+
                '<td>Sentencias</td>'+
                '<td id="sry_sent">0</td>'+
                '<td id="sry_sent_avg">0</td>'+
            '</tr>'+
            '<tr>'+
                '<th scope="row">3</th>'+
                '<td>Annotaciones</td>'+
                '<td id="sry_ann">0</td>'+
                '<td id="sry_ann_avg">0</td>'+
            '</tr>'+
        '</tbody>';
            
        
        $("#sry_table").html(html_table);
        // calculando cantidad de categorias
        var H = {};
        for (i in A){
            var ann = A[i];
            var tags = ann["tag"];
            for (j in tags){
                var tt = tags[j];                
                if (tt in H){
                    H[tt] =  H[tt] + 1;
                }
                else{
                    H[tt] = 1;
                }
            }         
        }
        
        
        var T = {};
        for (l in link2type){
            var tt = link2type[l];           
            if (tt in T){
                T[tt] =  T[tt] + 1;
            }
            else{
                T[tt] = 1;
            }
                    
        }
        
        $("#sry_doc").html(D.length);
        $("#sry_sent").html(Sentences.length);
        $("#sry_sent_avg").html(Sentences.length/D.length);
        $("#sry_ann").html(A.length);
        $("#sry_ann_avg").html(A.length/D.length);
        
        
        var pos = 4;
        for (i in H){
            var h = H[i];
            $("#sry_table").append('<tr><th scope="row" class="text-primary">'+pos.toString()+'</th><td class="text-primary">'+i+'</td><td class="text-primary">'+h+'</td><td class="text-primary" >-</td></tr>');
            pos = pos + 1;
        }
        
        for (i in T){
            var h = T[i];
            $("#sry_table").append('<tr><th scope="row" class="text-success">'+pos.toString()+'</th><td class="text-success">'+i+'</td><td class="text-success">'+h+'</td><td class="text-success">-</td></tr>');
            pos = pos + 1;
        }
        
        //$("#sry_table").append('<tr><th scope="row">1</th><td>Documentos</td><td>0</td><td>-</td></tr>');
        
        
        
        $('#modalSummary').modal("show");
    });
    
    
    
    
    ///---------------------------------------------------
    // EL systems 
    //MI_APIKEY = "c6d8a1d1-d912-42f8-80da-ccf1l49721t5";
    MI_APIKEY = "c6d8a1d1-d912-42f8-80da-ccf1l49721t5";
    sysA = [];
    sysSentences = [];
    sysD = [];
    /*
    D = []; // Documentos    {uri:"http://example.org/Doc1" "inDocCounter":1}
    A = []; // Arreglo que va a tener las annotaciones, de la forma {"ini":1, "fin":3, "idA":1,  "uri":["http://example.org/enriry1","http://example.org/enriry2"], "tag":["ex:type1", ..], "id_sentence":1  "uridoc":"http://aaaa.doc1"}
    Sentences = []; // Lista de oraciones del documento   {text:"..."  uridoc:"http://example.org/Doc1"}
    */
    
    systems = {
        0: {
            "name":"Babelfy_only_named_entities",
            "id":0,
            "type":"POST",
            "url":"https://babelfy.io/v1/disambiguate",
            "text":"",
            "lang":"EN",
            "key":"c6d8a6d4-c919-42f8-80da-ccf124975145"
        },
        1: {
            "name":"Babelfy_with_concepts",
            "id":1,
            "lang":"EN",
            "type":"POST"
        },
        2: {
            "name":"DBpedia Spotlight",
            "id":2,
            "lang":"EN",
            "type":"POST"
        },
        3: {
            "name":"AIDA",
            "id":3,
            "lang":"EN",
            "type":"POST"
        },
        4: {
            "name":"FREME NER",
            "id":4,
            "lang":"EN",
            "type":"POST"
        },
        5: {
            "name":"FRED",
            "id":5,
            "lang":"EN",
            "type":"POST"
        },
        6: {
            "name":"Tagme2",
            "id":6,
            "lang":"EN",
            "type":"POST"
        },
        7: {
            "name":"FOX",
            "id":7,
            "lang":"EN",
            "type":"POST",
            "model":""
        },
        8: {
            "name":"StanfordEN-FOX",
            "id":8,
            "lang":"EN",
            "type":"POST",
            "model":"org.aksw.fox.tools.ner.en.StanfordEN"
        },
        9: {
            "name":"BalieEN-FOX",
            "id":9,
            "lang":"EN",
            "type":"POST",
            "model":"org.aksw.fox.tools.ner.en.BalieEN"
        },
        10: {
            "name":"OpenNLPEN-FOX",
            "id":10,
            "lang":"EN",
            "type":"POST",
            "model":"org.aksw.fox.tools.ner.en.OpenNLPEN"
        },
        11: {
            "name":"IllinoisExtendedEN-FOX",
            "id":11,
            "lang":"EN",
            "type":"POST",
            "model":"org.aksw.fox.tools.ner.en.IllinoisExtendedEN"
        },
        12: {
            "name":"Nerd-combined",
            "id":12,
            "lang":"EN",
            "type":"POST",
            "model":"combined"
        },
        
    }
    
    //initializing
    for (s_i in systems){
        s = systems[s_i];
        $("#sys_selector").append($('<option>', {
            value: s["id"],
            text: s["name"]
        }));
    }
    
    /*
    $("#sys_annotate").click(function(){
        var ido = $("#sys_selector").val();

        //console.log(["values:",systems[ido]]);
        var text = $("#sys_inDoc").val();

        if (text == undefined || text == ""){
            warning_alert("You should specify some text as input!");
            return false;
        }
        
        
        systems[ido]["text"] = text;
        $.ajax({
            //data:params,
            data:{"values":systems[ido]},
            url: 'elsystems.php',
            type: 'POST',
            dataType: "html",
            beforeSend: function(){},
            success: function(response){
                show_results(response);
            },
            error: function(response){console.log(["Error:",response]);}
        });
    });
    */
    
    //RR = [];
    current_iddoc = 0;
    sincronism_ajax = function(pSent,ido_system){
        if (pSent == sysSentences.length){
            // end of the recurtion
            //show_results_sentences();
            add_annotations_to_display(current_iddoc);
            $.unblockUI();
        }
        else{
            systems[ido_system]["text"] = sysSentences[pSent]["text"];
            $.ajax({
                //data:params,
                data:{"values":systems[ido_system]},
                url: 'elsystems.php',
                type: 'POST',
                dataType: "html",
                beforeSend: function(){},
                success: function(response){
                    console.log(["HUBO RESPONSE:",response]);
                    var name_doc = $("#sys_urldoc_input").val();
                    var _json_response = JSON.parse(response);
                    var _json_sorted = getSortedAnnotations(_json_response);
                    console.log(["_json_response:",_json_response]);
                    console.log(["_json_sorted:",_json_sorted]);
                    
                    for (r in _json_sorted){
                        var ann = _json_sorted[r];
                        sysA.push({
                            "uridoc": name_doc,
                            "id_sentence":pSent,
                            "idA" : sysA.length,
                            "ini": ann["ini"],
                            "fin": ann["fin"],
                            "uri": ann["uri"],
                        });
                    }
                    console.log(["pSent+1:",pSent+1,"   ido_system:",ido_system]);
                    sincronism_ajax(pSent+1,ido_system);
                    //RR.push(response.substr(13,response.length - 15 ));
                },
                error: function(response){
                    warning_alert("There were errors in the system API");
                    $.unblockUI();
                    return false;
                }
            }); 
        }        
    }
    
    
    sysEvaluationBySentence = false;
    $("#sys_annotate_sentence").click(function(){
        sysEvaluationBySentence = true;
        sys_annotate();
    });
    
    
    $("#sys_annotate_document").click(function(){
        sysEvaluationBySentence = false;
        sys_annotate();
    });
    
    sys_annotate = function(){
        var ido = $("#sys_selector").val();

        //console.log(["values:",systems[ido]]);
        var text = $("#sys_inDoc").val();

        if (text == undefined || text == ""){
            warning_alert("You should specify some text as input!");
            return false;
        }
        
        // is the name of the document entered?
        var name_doc = $("#sys_urldoc_input").val();
        if (name_doc == "" || name_doc == undefined){
            warning_alert("You should specify the URI of this document.");
            return false;
        }
        
        console.log('uridoc2id(sysD,name_doc):',uridoc2id(sysD,name_doc) );
        if (uridoc2id(sysD,name_doc) != -1){
            warning_alert("You must specify a new name for this document, different from the ones that have already been added.");
            return false;
        }
        
        if (sysEvaluationBySentence == true){
            $.blockUI({ message: null });
            var name_doc = $("#sys_urldoc_input").val();
            var iddoc = sysD.length;
            sysD.push({
                "uri":name_doc,
                "inDocCounter": iddoc,
            });
            
            var ini_Sent = sysSentences.length;
            var S = text.split("\n");
            for (i in S){
                var sent = S[i];
                if (sent == ""){continue;}                
                
                var id_sentence = sysSentences.length;
                sysSentences.push({
                    "text":  sent,
                    "uridoc": name_doc,
                });
            }
            current_iddoc = iddoc;
            sincronism_ajax(ini_Sent,ido);
            //show_results('{"response":['+RR.join(",")+']}');            
        }
        else { // by document
            systems[ido]["text"] = text;
            $.blockUI({ message: null });
            $.ajax({
                //data:params,
                data:{"values":systems[ido]},
                url: 'elsystems.php',
                type: 'POST',
                dataType: "html",
                beforeSend: function(){},
                success: function(response){
                    show_results(response);
                    $.unblockUI();
                },
                error: function(response){
                    warning_alert("There were errors in the system API");
                    $.unblockUI();
                }
            }); 
        }
    };
    
    
    /*// type of response
    [
    {
      "ini": 0,
      "fin": 5,
      "babelSynsetID": "bn:00216507n",
      "DBpediaURL": "http://dbpedia.org/resource/Barack_(brandy)",
      "BabelNetURL": "http://babelnet.org/rdf/s00216507n"
    },
    {
      "ini": 5,
      "fin": 11,
      "babelSynsetID": "bn:03330021n",
      "DBpediaURL": "http://dbpedia.org/resource/Barack_Obama",
      "BabelNetURL": "http://babelnet.org/rdf/s03330021n"
    }*/
    show_results = function(resp){
        //alert(resp);
        console.log(resp);
        var json_response = JSON.parse(resp);
        if ("error" in json_response){
            var json_response = JSON.parse(resp);
            warning_alert("API error: " + json_response["error"]);
            return false;
        }
        
        var text = $("#sys_inDoc").val();
        var json_sorted = getSortedAnnotations(json_response);
        console.log(["json_sorted:",json_sorted]);
        var name_doc = $("#sys_urldoc_input").val();
        
        // Adding this document to the environment
        var iddoc = sysD.length;
        sysD.push({
            "uri":name_doc,
            "inDocCounter": iddoc,
        });
        
        
        //if (sysEvaluationBySentence == false){
            var id_sentence = sysSentences.length;
            sysSentences.push({
                "text":  text,
                "uridoc": name_doc,
            });
        //}
        //else{
            
        //}
        
        for (r in json_sorted){
            var ann = json_sorted[r];
            sysA.push({
                "uridoc": name_doc,
                "id_sentence":id_sentence,
                "idA" : sysA.length,
                "ini": ann["ini"],
                "fin": ann["fin"],
                "uri": ann["uri"],
            });
        }
        
        add_annotations_to_display(iddoc);
    }
    
    
    
    /*show_results_sentences = funcion(){
        // the input is in RR
        alert("here in show_results_sentences");
        console.log(["RR:",RR]);
    }*/
    
    
    wrapp_in_box = function(_html,_iddoc){
        var _ido = $("#sys_selector").val();
        var ttype_ann = "by Sentences";
        if (sysEvaluationBySentence == false){
            ttype_ann = "by Document";
        }
        var labels_html = '<span class="label label-info">#'+_iddoc+'</span>&nbsp;' +
            '<span class="label label-info">Type of annotation: '+ttype_ann+'</span>&nbsp;' +
            '<span class="label label-info">Annotator: '+systems[_ido]["name"]+'</span>';
        return ''+
        '<div id="sys_doc'+_iddoc+'" class="col-lg-12 row parent_show drop-shadow" style="margin-left:5px!important;">  '+      
            '<div class="row">'+
                //--
                '<div id= "sys_labels'+_iddoc+'"class="col-lg-12">'+labels_html+'<br>'+
                '</div>'+
                //--
                '<div class="col-lg-12">'+
                    '<div class="input-group control-group">'+
                        '<input class="sys_urldoc" iddoc="'+_iddoc+'" style="width:100%!important;height:35px;padding: 5px;" value="'+sysD[_iddoc]["uri"]+'" id="sys_urldoc'+_iddoc+'" type="text">'+
                        '<div class="input-group-btn">'+
                            '<button id="sys_modifyIdDoc'+_iddoc+'" class="btn btn-secondary sys_modifyIdDoc" type="button" iddoc="'+_iddoc+'"><i class="glyphicon glyphicon-edit"></i> Modify</button>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="col-lg-12">'+ _html +
                    //'<div class="div_parent">'+
                    //    '<div class="right-wrapper">'+
                    //        '<div class="right">'+
                    //            '<div style="width: 100%;padding-left:10px;">dsdfsdfsf<br>&nbsp;</div>'+
                    //        '</div>'+
                    //    '</div>'+
                    //    '<div class="left div_line"> &nbsp;1'+ 
                    //        '<a href="javascript:delete_sentence(0)"><i style="color:red!important;" class="fa fa-trash"></i></a>'+
                    //    '</div>'+
                    //'</div>'+
                '</div>'+
            '</div>'+
        '</div>'
    }
    
    add_annotations_to_display = function(iddoc){
        
        var ini = 0;
        var fin = 0;
        var overall = 0;
        //var pos = 0;
        
        console.log(["iddoc:",iddoc]);
        var inDocCounter = sysD[iddoc]["inDocCounter"];
        var urldoc = sysD[iddoc]["uri"];
      
        //var text = $("#sys_inDoc").val();
        //var ntext = text.length;
        var textOut = "";
        var overall = 0;
        var pos = 0;
        
        //var lasUriDoc = "";
        for (i_s in sysSentences){
            if (sysSentences[i_s]["uridoc"] != urldoc){
                continue;
            }
            sent = sysSentences[i_s]["text"];
            console.log("SSSEENNNTTT::",sysSentences[i_s]["text"]);
            var temp_i = parseInt(i_s);

            
            textOut = textOut + '<div class="div_parent"><div class="right-wrapper"><div class="right"><div style="width: 100%;padding:10px;">';
            
            for (index in sysA){
                
                var ann = sysA[index];
                console.log(['ann["id_sentence"]:',ann["id_sentence"],"   i_s:",i_s]);
                if (ann["id_sentence"]!=i_s){ //ann["uridoc"] != urldoc 
                    continue;
                }
                
                ini = ann["ini"];
                fin = ann["fin"]+1;
                
                
                
                var indexpp = parseInt(index) +1 ;
                if (indexpp < sysA.length){ // si no es el ultimo, y además, hay overlapping
                    
                    var ann2 = sysA[indexpp];
                    if (ann["fin"]>ann2["ini"] && ann["id_sentence"] == ann2["id_sentence"]){
                        fin = ann2["ini"];
                        ann["overlap"] = true;
                        ann2["overlap"] = true;
                        //console.log("OPTT");
                    }
                }
                
                var st = "";
                if ("overlap" in ann){
                    if (ann["overlap"] == true){
                        st = 'style="background-color: #88783a;"';
                    }
                    else{
                        st = 'style="background-color: #337ab7;"';
                    }
                    ann["overlap"] = false;
                }
                
                //var label = text.substr(ini,fin-ini);
                var label = sent.substring(ini,fin);
                console.log("------------------");
                console.log(["index:",index,"  ini:",ini,"   fin:",fin, "   pos:",pos]);
                console.log(["label:",label]);
                var httpAnnotation = '<span idesys="'+index+'" class="sysLabel" data-toggle="tooltip" title="'+ann["uri"].join()+'" '+st+'>'+label+'</span>';
                //textOut = textOut + text.substring(pos,ini) + httpAnnotation;
                textOut = textOut + sent.substring(pos,ini) + httpAnnotation;
                pos = fin;
                
                //standarizing 
                sysA[index]["ini_no_overall"] = ann["ini"];
                sysA[index]["fin_no_overall"] = ann["fin"];
                
                sysA[index]["ini"] = ann["ini"] + overall;
                sysA[index]["fin"] = ann["fin"] + overall;
            }
            // the remain 
            console.log(["pos:",pos]);
            textOut = textOut + sent.substr(pos)+"<br>&nbsp;";
            pos = 0;

            var temp_i_plus_1 = temp_i +1;
            textOut = textOut + '</div></div></div>'+ 
            '<div class="left div_line"> &nbsp;'+temp_i_plus_1.toString()+
            //" <a href='javascript:delete_sentence("+temp_i.toString()+")'><i style='color:red!important;' class='fa fa-trash'></i></a>"+
            '</div></div>';
            overall = overall+sent.length+1;
        } //-- aquiii
        
        //$("#sys_DisplayBlock").html(wrapp_in_box(textOut));
        $("#sys_DisplayBlock").append(wrapp_in_box(textOut,iddoc));
        $("#sys_urldoc_input").val("https://example.org/doc"+sysD.length);
    }
    
    
    // obtengo la lista de anotaciones de una oración especificada en forma ordenada
    getSortedAnnotations = function(json_response){
        sysA_temp = [];
        
        // first, translate he json
        for (k in json_response["response"]){
            var ann = json_response["response"][k];
            //console.log(["ann:",ann]);
            //console.log(["-->",'babelSynsetID' in ann]);
            var ta = {
                "ini": parseInt(ann["ini"]),
                "fin": parseInt(ann["fin"]),
                "uri": []
            };
            if ('WikipediaURL' in ann){
                ta["uri"].push(ann["WikipediaURL"]);
            }
            if ('DBpediaURL' in ann){
                ta["uri"].push(ann["DBpediaURL"]);
            }
            if ('BabelNetURL' in ann){
                ta["uri"].push(ann["BabelNetURL"]);
            }
            if ('YAGOid' in ann){
                ta["uri"].push(ann["YAGOid"]);
            }
            sysA_temp.push(ta);
        }
        
        
        // sorting
        var SortedList = []; // Lista ordenada de las annotaciones según la posicion inicial de cada una
        var temp = [];
        for (k in sysA_temp){
            var ann = sysA_temp[k];
            //console.log("------ ");
            //console.log(ann);
            //console.log("id_sentence:",ann["id_sentence"],"  ids:",ids);
            //insertar la annotación en su posición, que quede ordenado el arreglo por la posición inicial
            //supongo que ya SortedList esta ordenado               
            var inserted = false;
            for (j in SortedList){ // voy poniendo "e" en "temp" hasta que le toque a "ann"
                var index_j = parseInt(j);
                e = SortedList[j];
                if (ann["ini"]==e["ini"] && !inserted){ // ordeno segun "fin"
                    if (ann["fin"]==e["fin"]){
                        console.log(["ann:",ann,"  e:",e]);
                        warning_alert("This entity has already added.");
                        return 0; 
                    }
                    if (SortedList.length-1 == index_j){// en caso de que "e" sea el último
                        inserted = true;
                        if (ann["fin"]<e["fin"]){
                            temp.push(ann);
                            temp.push(e);
                        }
                        else{
                            temp.push(e);
                            temp.push(ann);
                        }
                        inserted = true;
                    }
                    else{
                        var e2 = SortedList[index_j+1];
                        if (ann["fin"]<e2["fin"]){
                            temp.push(ann);
                            temp.push(e);
                            inserted = true;
                        }
                        else{
                            temp.push(e);
                        }
                    }
                } else if (ann["ini"]<e["ini"] && !inserted){  // inserto primero ann, y después e
                    inserted = true;
                    temp.push(ann);
                    temp.push(e);
                } 
                else{
                    temp.push(e);
                }
            }
            if (!inserted){
                temp.push(ann);
            }
            SortedList = temp;
            temp = [];

        }
        return SortedList;
    };
    
    
    
    // click in the annotations of the systems
    $('body').on('click', 'span.sysLabel' , function(){
        var ide = $(this).attr("idesys");
        $("#sry_table").empty();
        
        var html_table = '<thead>'+
            '<tr>'+
                '<th scope="col">#</th>'+
                '<th scope="col">link</th>'+
                '<th scope="col">action</th>'+
            '</tr>'+
        '</thead>'+
        '<tbody>'+
        '</tbody>';
            
        
        $("#sry_table").html(html_table);
       
        
        
        var pos = 1;
        for (o in sysA[ide]["uri"]){
            var ll = sysA[ide]["uri"][o];
            //there are some KB (e.g., YAGO) without link
            var llink = '<td><button class="btn btn-info link" type="button" onclick="window.open(\''+ll+'\',\'_blank\')"><i class="glyphicon glyphicon-link"></i>Link</button></td>';
            if (ll.indexOf("YAGO:")==0){
                llink = "<td></td>";
            }
            $("#sry_table").append('<tr><th scope="row">'+pos.toString()+'</th><td>'+ll+'</td>'+llink+'</tr>');
            pos = pos + 1;
        }
        $('#modalSummary').modal("show");
        
    });
    
    
    $("#sys_split_sentence").click(function(){
        var inText = $("#sys_inDoc").val();
        var _res = splitBySentences(inText); 
        $("#sys_inDoc").val(_res);
    });
    
    $(document).on('change', '.sys_urldoc', function () {
        var iddoc = $(this).attr("iddoc");
        $("#sys_modifyIdDoc"+iddoc).addClass("redHighlited");
    });
    
    $(document).on('click', '.sys_modifyIdDoc', function () {
        var iddoc = $(this).attr("iddoc");        
        var new_uri_doc = $("#sys_urldoc"+iddoc).val();
        
        // is the name of the document entered?
        if (new_uri_doc == "" || new_uri_doc == undefined){
            warning_alert("You should specify the URI of this document.");
            return false;
        }
        
        if (uridoc2id(sysD,new_uri_doc) != -1){
            warning_alert("You must specify a new name for this document, different from the ones that have already been added.");
            return false;
        }
        
        $("#sys_modifyIdDoc"+iddoc).removeClass("redHighlited");
        sysD[iddoc]["uri"] = new_uri_doc;
        warning_alert("The URI was successfully changed!");
        
    });

    
    
    ///----- Validation tab
    V = {};
    
    
    V[1] = {
        "name":"Link validations",
        "date":"-",
        "time":"-",
        "description":"Here we check if each link is valid or not. Also, we identify if they are ambiguous or redirect Wikipages",
        "number_errors":"-",
        "errors":[],
        "type":"static",
        "requireInternet": true
    };
    
    V[2] = {
        "name":"Overlapping checker",
        "date":"-",
        "time":"-",
        "description":"Here we check that the overlap tags are correct (maximum, minimum and intermediate).",
        "number_errors":"-",
        "errors":[],
        "type":"static"
    };
    
    V[3] = {
        "name":"Reference checker",
        "date":"-",
        "time":"-",
        "description":"Here we check that the reference tags are correct (antecedent and coreference). Only for Proper Names and Pro-Form!",
        "number_errors":"-",
        "errors":[],
        "type":"static"
    };
    
    
    V[4] = {
        "name":"Refining References",
        "date":"-",
        "time":"-",
        "description":"Here you can keep the mnt:AntecedentRf/mnt:CoreferenceRf tags only for Proper Names and Pro-Forms",
        "number_errors":"-",
        "errors":[],
        "type":"dinamic",
        "automatic_expresion":"<tag@mnt:NumericTemporalPN,tag@mnt:CommonFormPN><tag@mnt:AntecedentRf,tag@mnt:CoreferenceRf>%(mnt:AntecedentRf,mnt:CoreferenceRf)"
    };
    
    
    V[5] = {
        "name":"Spelling checker",
        "date":"-",
        "time":"-",
        "description":"Those entity mentions with special characters or spaces on the borders, or with missing characters are identified.",
        "number_errors":"-",
        "errors":[],
        "type":"static"
    };
    
    V[6] = {
        "name":"Surface form checker",
        "date":"-",
        "time":"-",
        "description":"We check here if the label of the annotations match with their correspondig sbstrings.",
        "number_errors":"-",
        "errors":[],
        "type":"static"
    };
    
    
    
    
    updateMainTableValidation = function(){
       $("#valid_mainTable").empty();
       
       var html_table = '<thead>'+
                        '<tr>'+
                            '<th scope="col" style="width: 50px;">#</th>'+
                            '<th scope="col" style="width: 200px;">Name</th>'+
                            '<th scope="col" style="width: 70px;">Erros</th>'+
                            '<th scope="col" style="width: 100px;">Date</th>'+
                            '<th scope="col" style="width: 100px;">Time</th>'+
                            '<th scope="col">Description</th>'+
                            '<th scope="col" style="text-align:center;width: 100px;">Action</th>'+
                        '</tr>'+
                    '</thead>'+
                    '<tbody>'+                     
                    '</tbody>';
       
                            
       
       $("#valid_mainTable").html(html_table);
       var pos = 1;
       for (i in V){
           var v = V[i];
           var ttt = '<i class="fa fa-times fa-lg"></i>';
           var classColor='';
           var color_btn = "btn-secondary";
           if ("requireInternet" in v && v["requireInternet"] == true){
               color_btn = "btn-success";    
           }
           var actions = '<button class="btn '+color_btn+' valid_btnRun" type="button" idv="'+i+'" data-toggle="tooltip" title="Run cheker '+v["name"]+'"><i class="glyphicon glyphicon-expand"></i></button>';
           
           if (v["number_errors"]!="-"){
               ttt = '<i class="fa fa-lg fa-check"></i>';
               classColor='class="text-primary"';
               actions = '<button class="btn btn-secondary valid_btnDescription" type="button" idv="'+i+'" data-toggle="tooltip" title="Details of '+v["name"]+'"><i class="glyphicon glyphicon-th"></i></button>'+
               '<button class="btn '+color_btn+' valid_btnRun" type="button" idv="'+i+'" data-toggle="tooltip" title="Run cheker '+v["name"]+'"><i class="glyphicon glyphicon-repeat"></i></button>';
               
           }


           var table_html_tr = '<tr>'+
                            '<td '+classColor+'>'+ttt+' '+pos+'</td>'+
                            '<td '+classColor+'>'+v["name"]+'</td>'+
                            '<td '+classColor+'>'+v["number_errors"]+'</td>'+
                            '<td '+classColor+'>'+v["date"]+'</td>'+
                            '<td '+classColor+'>'+v["time"]+'</td>'+
                            '<td '+classColor+'>'+v["description"]+'</td>'+
                            '<td '+classColor+' style="text-align:center;width: 100px;">'+actions+'</td>'+
                        '<tr>';
           $("#valid_mainTable").append(table_html_tr);
           pos = pos + 1;
       }
    }
    updateMainTableValidation();
   
    
    // you can specify a conjunctions, e.g. {}<>{}{}<><>
    checkContrain = function(a,_constrain){
        console.log("---------------");
        var found = false;
        while (_constrain.indexOf("{") != -1){
            var L = textBetween(_constrain,"{","}").split(",");
            for (var c_i in L){
                var l = L[c_i];
                if (l.indexOf("tag")!=-1){
                    var ttag = l.split("@")[1];
                    if ("tag" in a &&  a["tag"].indexOf(ttag)==-1){
                        return false;
                    }
                }
                else if (l.indexOf("mnt")!=-1){
                    var tmnt = l.split("@")[1];
                    if (a["label"] != tmnt){
                        return false;
                    }
                }
                
            }
            _constrain = _constrain.substring(_constrain.indexOf("}")+1,_constrain.length);
        }
        
        
        while(_constrain.indexOf("<") != -1){
            var L = textBetween(_constrain,"<",">").split(",");
            found = false;
            for (var c_i in L){
                var l = L[c_i];
                if (l.indexOf("tag")!=-1){
                    var ttag = l.split("@")[1];
                    if ("tag" in a && a["tag"].indexOf(ttag)!=-1){
                        found = true;
                        break;
                    }
                }
                else if (l.indexOf("mnt")!=-1){
                    var tmnt = l.split("@")[1];
                    if (a["label"] == tmnt){
                        found = true;
                        break;
                    }
                }
            }
            if (found == false){
                return false;
            }
            _constrain = _constrain.substring(_constrain.indexOf(">")+1,_constrain.length);        
        }
        
        return true;
    }
    
    
    //--
    $(document).on('click', '.valid_btnRun', function () {
        var idv = $(this).attr("idv");
        v = V[idv];
        V[idv]["errors"] = [];
        
        
        if (v["type"] == "static"){
            if (v["name"] == "Link validations"){
                valid_CheckUnambiguousLinks(idv);
            } 
            else if (v["name"] == "Overlapping checker"){
                $.blockUI({ message: null });
                valid_CheckOverlaps(idv);
                $.unblockUI();
            } 
            else if (v["name"] == "Reference checker"){
                $.blockUI({ message: null });
                valid_CheckReferences(idv);
                $.unblockUI();
            }
            else if (v["name"] == "Spelling checker"){
                $.blockUI({ message: null });
                valid_CheckSpelling(idv);
                $.unblockUI();
            }
            else if (v["name"] == "Surface form checker"){
                $.blockUI({ message: null });
                valid_CheckSurfaceForm(idv);
                $.unblockUI();
            }
        }
        else{
            
            var aut_exp = v["automatic_expresion"];
            var constrain = aut_exp.split("%")[0];
            var exp = aut_exp.split("%")[1];
            var count_errors = 0;
            for (aa_i in A){
                var aa = A[aa_i];
                if (checkContrain(aa,constrain) == true){
                    //valid_fix_error(exp,aa,idv);
                    count_errors = count_errors +1;
                    V[idv]["errors"].push({
                        "status":"uncorrected",
                        "position": count_errors,
                        "idA" : aa_i,
                        "uridoc": aa["uridoc"],
                        "label":aa["label"],
                        "id_sentence": aa["id_sentence"],
                        "error_detail": "Mention <i>"+aa["label"]+"</i> matchs with the specified constrain!",
                        "automatic_expresion": exp
                    });
                }
            }
            
            //updating main table
            V[idv]["number_errors"] = count_errors;
            V[idv]["time"]= new Date().toLocaleTimeString();
            V[idv]["date"]= new Date().toLocaleDateString();
            updateMainTableValidation();
            
            //displaying the content
            valid_idvToShow = idv;
            valid_showContent();
        }
        //$.unblockUI();
    });
    
    
    //--
    valid_CheckLinks = function(_idv){
        alert("Not Yet :)");
    }
    
    
    
    update_block_caption = function(id_div,progress,total){
        var porc = parseInt((progress*100)/total);
        $("#"+id_div).html("Progress: "+porc+"%");
    }
    
    
    valid_valLinks = 0;
    valid_refLinks = 0;
    valid_disLinks = 0;
    sincronism_redirect_disamb_Links = function(_a_i, _a_j, _idv_){
        if (_a_i == A.length){
            //updating main table
            V[_idv_]["number_errors"] = unambiguousErrors;
            V[_idv_]["time"]= new Date().toLocaleTimeString();
            V[_idv_]["date"]= new Date().toLocaleDateString();
            updateMainTableValidation();
            
            //displaying the content
            valid_idvToShow = _idv_;
            valid_showContent();
            $.unblockUI();
            var htmlMessage = "<b>Not Valid: </b>"+valid_valLinks+"<br>  <b>Redirect: </b>"+valid_refLinks+"<br>  <b>Ambiguous:</b> "+valid_disLinks;
            warning_alert(htmlMessage);
        }
        else{
            update_block_caption('validation_disamb',_a_i,A.length);
            var ann_ = A[_a_i];                    
            var uri = ann_["uri"][_a_j];
            //console.log(["uri:",uri]);
            $.ajax({
                //data:params,
                data:{"values":{"uri":uri}},
                url: 'elvalidation.php',
                type: 'POST',
                dataType: "html",
                beforeSend: function(){},
                success: function(response){
                    //console.log(["response:",response]);
                    var json_response = "";
                    try {
                        json_response = JSON.parse(trim_1(response));
                    }
                    catch(err) {
                        console.log(["-> error:",err]);
                        var next_aj = _a_j + 1;
                        if (next_aj == ann_["uri"].length){
                            _a_i = _a_i +1;
                            next_aj = 0;
                        } 
                        sincronism_redirect_disamb_Links(_a_i,next_aj,_idv_);
                        return true;
                    }
                    
                    var resp =  json_response;                    
                    if ("response" in resp){
                        if (resp["response"]["valid"] == false){
                            unambiguousErrors = unambiguousErrors +1;
                            valid_valLinks = valid_valLinks +1;
                            
                            V[_idv_]["errors"].push({
                                "status":"uncorrected",
                                "position": unambiguousErrors,
                                "idA" : _a_i,
                                "uridoc": ann_["uridoc"],
                                "label":ann_["label"],
                                "id_sentence": ann_["id_sentence"],
                                "error_detail": "The uri <a href="+uri+">"+uri+"</a> of the mention <i>"+ann_["label"]+"</i> is not a valid link.",
                                //"automatic_expresion": "["+correctOverlapTag+"]("+tagOverlapList.join()+")"
                            });
                        } 
                        else if (resp["response"]["redirect"] == true){
                            unambiguousErrors = unambiguousErrors +1;
                            valid_refLinks = valid_refLinks +1;
                            
                            V[_idv_]["errors"].push({
                                "status":"uncorrected",
                                "position": unambiguousErrors,
                                "idA" : _a_i,
                                "uridoc": ann_["uridoc"],
                                "label":ann_["label"],
                                "id_sentence": ann_["id_sentence"],
                                "error_detail": "The uri <a href="+uri+">"+uri+"</a> of the mention <i>"+ann_["label"]+"</i> is a redirect page.",
                                //"automatic_expresion": "["+correctOverlapTag+"]("+tagOverlapList.join()+")"
                            });
                        } 
                        else if (resp["response"]["disambiguation"] == true){
                            unambiguousErrors = unambiguousErrors +1;
                            valid_disLinks = valid_disLinks +1;
                            
                            V[_idv_]["errors"].push({
                                "status":"uncorrected",
                                "position": unambiguousErrors,
                                "idA" : _a_i,
                                "uridoc": ann_["uridoc"],
                                "label":ann_["label"],
                                "id_sentence": ann_["id_sentence"],
                                "error_detail": "The uri <a href="+uri+">"+uri+"</a> of the mention <i>"+ann_["label"]+"</i> is a disambiguation page.",
                                //"automatic_expresion": "["+correctOverlapTag+"]("+tagOverlapList.join()+")"
                            });
                        }
                    }                  
                    
                    
                    var next_aj = _a_j + 1;
                    if (next_aj == ann_["uri"].length){
                        _a_i = _a_i +1;
                        next_aj = 0;
                    }
                    sincronism_redirect_disamb_Links(_a_i,next_aj,_idv_);
                    
                },
                error: function(response){
                    console.log(["error:",response]);
                    var next_aj = _a_j + 1;
                    if (next_aj == ann_["uri"].length){
                        _a_i = _a_i +1;
                        next_aj = 0;
                    }
                    sincronism_redirect_disamb_Links(_a_i,next_aj,_idv_);
                }
            });
            
        }        
    }
    
    
    //--
    unambiguousErrors = 0;
    valid_CheckUnambiguousLinks = function(_idv){
        unambiguousErrors = 0;
        valid_valLinks = 0;
        valid_refLinks = 0;
        valid_disLinks = 0;
        $.blockUI( {
                message: '<div id="validation_disamb">Progress: 0%</div>',
                css: { 
                    border: 'none', 
                    padding: '15px', 
                    backgroundColor: '#000', 
                    '-webkit-border-radius': '10px', 
                    '-moz-border-radius': '10px', 
                    opacity: .5, 
                    color: '#fff' 
                }
            }
        );
        //$.blockUI({ message: null });
        sincronism_redirect_disamb_Links(0,0,_idv);
    }
    
    
    
    
    //--
    valid_hayOverlapping = function(i){
        var ann = A[i];
        var ini = ann["ini"];
        var fin = ann["fin"];
        
        var b = false
        var bini = false;  //beforeIni, is when some overlapping statement starts before the current one
        var aini = false;  //afterIni
        var bfin = false;
        var afin = false;
        
        var has_interior = false
        var has_exterior = false
        
        for (k in A){
            var _ann = A[k];
            if ((k == i) || (ann["id_sentence"] != _ann["id_sentence"])){continue;}
            var ini_ = _ann["ini"];
            var fin_ = _ann["fin"];

            if ((ini <=ini_ && ini_ <= fin) || (ini_ <= ini && ini <= fin_)){
                b = true
                bini = (bini || (ini_ <= ini))
                aini = (aini || (ini_>= ini))
                bfin = (bfin || (fin_ <= fin))
                afin = (afin || (fin_ >= fin))
                    
                has_interior = (has_interior || ((ini <= ini_) && (fin>=fin_)))
                has_exterior = (has_exterior || ((ini >= ini_) && (fin<=fin_)))
            }
        }
        return [b,has_exterior,has_interior];
    }

            
        //-
        valid_overlap_tag = function(i){
            var ann = A[i];
            //console.log(["ann:",ann]);
            if (ann == undefined){return "mnt:Non-Overlapping";}
            
            var ini = ann["ini"];
            var fin = ann["fin"];
            
            var _result = valid_hayOverlapping(i);
            //console.log(["results:",_result]);
            var b_there_are_overlaps = _result[0];
            var b_ext = _result[1];
            var b_int = _result[2];
            
            if (b_there_are_overlaps == false){return "mnt:Non-Overlapping";}
            if (b_ext == true && b_int == false){return 'mnt:MinimalOverlap';}
            if (b_int == true && b_ext == false){return 'mnt:MaximalOverlap';}
            return 'mnt:IntermediateOverlap';
        }


    //--
    tagOverlapList = ["mnt:Non-Overlapping","mnt:MinimalOverlap","mnt:MaximalOverlap","mnt:IntermediateOverlap"];
    valid_CheckOverlaps = function(_idv){
        var count_errors = 0;
        for (a_i in A){
            var ann_ = A[a_i];
            if (!("tag" in ann)){continue;}
            var correctOverlapTag = valid_overlap_tag(a_i);
            
            if (ann_["tag"].indexOf(correctOverlapTag) == -1){
                count_errors = count_errors +1;
                V[_idv]["errors"].push({
                    "status":"uncorrected",
                    "position": count_errors,
                    "idA" : a_i,
                    "uridoc": ann_["uridoc"],
                    "label":ann_["label"],
                    "id_sentence": ann_["id_sentence"],
                    "error_detail": "Mention <i>"+ann_["label"]+"</i> should be "+correctOverlapTag,
                    "automatic_expresion": "["+correctOverlapTag+"]("+tagOverlapList.join()+")"
                });
            }
        } 
        
        //updating main table
        V[_idv]["number_errors"] = count_errors;
        V[_idv]["time"]= new Date().toLocaleTimeString();
        V[_idv]["date"]= new Date().toLocaleDateString();
        updateMainTableValidation();
        
        //displaying the content
        valid_idvToShow = _idv;
        valid_showContent();
    }
    
    
    //--
    valid_CheckReferences = function(_idv){
        var count_errors = 0;
        var current_doc = "";
        var _Set = {};
        var sent_temp = 0;
        var correctReferenceTag = {};
        for (s_i in Sentences){
            var s = Sentences[s_i];
            
            if (s["uridoc"] != current_doc){
                _Set = {};
                current_doc = s["uridoc"];
            }            
            
            var SentencesAnnotations = getSentencesAnnotations(s_i);
            for (a_i in SentencesAnnotations){                     
                var a = SentencesAnnotations[a_i];                

                if ("tag" in a &&  a["tag"].indexOf("mnt:Pro-formPN") != -1){
                    // have to be Coreference
                    correctReferenceTag[a["idA"]] = {"ref":"mnt:CoreferenceRf","id_sentence":-1};
                }
                else if ("tag" in a &&  a["tag"].indexOf("mnt:CommonFormPN")==-1 && a["tag"].indexOf("mnt:NumericTemporalPN") == -1){
                    var alreadyAnn = false;
                    for (var u_i in a["uri"]){
                        var u = a["uri"][u_i];
                        if (u.indexOf("mnt:entityType")==-1){
                            if (u in _Set){
                                alreadyAnn = true;
                                sent_temp = _Set[u];
                                console.log(["u:",u]);
                            }
                            else{
                                _Set[u] = a["id_sentence"];
                            }
                        }
                        
                    }
                    
                    if (alreadyAnn == true){
                        correctReferenceTag[a["idA"]] = {"ref":"mnt:CoreferenceRf","id_sentence":sent_temp};
                    }
                    else{
                        correctReferenceTag[a["idA"]] = {"ref":"mnt:AntecedentRf","id_sentence":a["id_sentence"]};
                    }                    
                }                
            }
        }
        
        
        for (a_i in A){
            var ann_ = A[a_i];
            if (!(ann_["idA"] in correctReferenceTag)){continue;}
            var val_ref = correctReferenceTag[ann_["idA"]];
            if (ann_["tag"].indexOf(val_ref["ref"]) == -1){
                count_errors = count_errors +1;
                var sent_id = parseInt(val_ref["id_sentence"])+1;
                var msg = "Mention <i>"+ann_["label"]+"</i> should be "+val_ref["ref"]+" because appear before in sentence "+sent_id+".";
                if (val_ref["id_sentence"] == -1){
                    msg = "Should be mnt:CoreferenceRf because <i>"+ann_["label"]+"</i> is a mnt:Pro-formPN.";
                }
                else if (val_ref["id_sentence"] == "mnt:AntecedentRf"){
                    msg = "Should be mnt:AntecedentRf because <i>"+ann_["label"]+"</i> does not appear before.";
                }
                V[_idv]["errors"].push({
                    "status":"uncorrected",
                    "position": count_errors,
                    "idA" : a_i,
                    "uridoc": ann_["uridoc"],
                    "label":ann_["label"],
                    "id_sentence": ann_["id_sentence"],
                    "error_detail": msg,
                    "automatic_expresion": "["+val_ref["ref"]+"](mnt:AntecedentRf,mnt:CoreferenceRf)"
                });
            }
        } 
        
        //updating main table
        V[_idv]["number_errors"] = count_errors;
        V[_idv]["time"]= new Date().toLocaleTimeString();
        V[_idv]["date"]= new Date().toLocaleDateString();
        updateMainTableValidation();
        
        //displaying the content
        valid_idvToShow = _idv;
        valid_showContent();
    }
    
    
    //--
    valid_CheckSpelling = function(idv){
        alert("Not Yet xD");
    }
    
    
    ///----
    
    valid_CheckSurfaceForm = function(_idv){
        var count_errors = 0;
        
        var overall = 0;
        var sent_id = -1;
        var sent_old = 0;
        var uridoc = "";
        for (a_i in A){
            var ann_ = A[a_i];
            var sent = Sentences[ann_["id_sentence"]]["text"];
            
            if (ann_["uridoc"] != uridoc){
                uridoc = ann_["uridoc"];
                sent_old = 0;
                sent_id = ann_["id_sentence"];
            }
            
            if (sent_id!=ann_["id_sentence"]){
                overall = overall + sent_old;
                sent_old = sent.length + 1;
                sent_id = ann_["id_sentence"];
            }
            
            var subsent = sent.substring(parseInt(ann_["ini"])-overall, parseInt(ann_["fin"])-overall);
            
            if (ann_["label"] != subsent){
                console.log(["ann:",ann_["label"],"   sent:",subsent]);
                count_errors = count_errors +1;
                var msg = "Mention <i>"+ann_["label"]+"</i> does not match with the corresponding substring in the text (<i>"+subsent+"</i>)";

                V[_idv]["errors"].push({
                    "status":"uncorrected",
                    "position": count_errors,
                    "idA" : a_i,
                    "uridoc": ann_["uridoc"],
                    "label":ann_["label"],
                    "id_sentence": ann_["id_sentence"],
                    "error_detail": msg
                });
            }
        } 
        
        
        //updating main table
        V[_idv]["number_errors"] = count_errors;
        V[_idv]["time"]= new Date().toLocaleTimeString();
        V[_idv]["date"]= new Date().toLocaleDateString();
        updateMainTableValidation();
        
        //displaying the content
        valid_idvToShow = _idv;
        valid_showContent();
    }
    
    
    valid_sent = function(i,uridoc){
        var temp_i = parseInt(i);
        var SentencesAnnotations = getSentencesAnnotations(i);
        //console.log(["i:",i]);
        //console.log(["SentencesAnnotations:",SentencesAnnotations]);
        pos = 0;
        textOut = "";
        var sent = Sentences[i]["text"];
        //console.log(["sent:",sent]);
        //console.log(["uridoc:",uridoc,"   uridoc2id(uridoc)",uridoc2id(D,uridoc)]);
        var txt = id2text(uridoc2id(D,uridoc));
        var overall = txt.indexOf(sent);
        for (j in SentencesAnnotations){                     
                var index = parseInt(j);
                ann = SentencesAnnotations[j];
                

                var ini = ann["ini"] - overall;
                var fin = ann["fin"] - overall;
                if (index+1 < SentencesAnnotations.length){
                    var ann2 = SentencesAnnotations[index+1];
                    if (ann["fin"]>ann2["ini"]){
                        fin = ann2["ini"] - overall;
                        ann["overlap"] = true;
                        ann2["overlap"] = true;
                    }
                }
                label = sent.substring(ini, fin);
                //console.log(["ini:",ini,"  label:",label]);
                var st = "";
                if ("tag" in ann){
                    if (ann["tag"].indexOf("tax:Ambiguous")>-1){
                        st = 'style="background-color: #5cb85c;"';
                    }
                }
                if ("overlap" in ann){
                    if (ann["overlap"] == true){
                        st = 'style="background-color: #88783a;"';
                    }
                    ann["overlap"] = false;
                }
                //--
                var mentionType = "";
                var ttype = typeOfAnn(ann["uri"]);
                
                if ( ttype != undefined){
                mentionType = '<i class="glyphicon '+type2icon[ttype]+'"></i>&nbsp;';  
                }
                //--
                var httpTags = "";
                if ("tag" in ann){
                    httpTags = ann["tag"].join()+"\n";
                }
                httpAnnotation = '<span ide="'+ann["idA"]+'"  class="blueLabel classlabelAnnotation"  data-toggle="tooltip" title="'+httpTags+ann["uri"].join()+'" '+st+'>'+mentionType+label+'</span>';
                textOut = textOut + sent.substring(pos,ini) + httpAnnotation;
                pos = fin;
            
        }
        return textOut;
    }
    
    valid_idSentence2html = function(id_sent,uridoc){
        
        var valid_text_sent = valid_sent(id_sent,uridoc);
        var id_sent_plus = (parseInt(id_sent)+1);
        return '<div class="div_parent">'+
                            '<div class="right-wrapper">'+
                                '<div class="right">'+
                                    '<div style="width: 100%;padding-left:10px;">'+valid_text_sent+'</div>'+
                                '</div>'+
                            '</div>'+
                            '<div class="left div_line"> &nbsp;'+id_sent_plus+
                            '</div>'+
                        '</div>';
    }
    
    //- details
    valid_idvToShow = -1;
    valid_showContent = function(){
        var _idv = valid_idvToShow;
        if (valid_idvToShow != -1){
            $("#valid_div_name_details").html("("+V[_idv]["number_errors"]+") Showing: "+V[_idv]["name"]);
            $("#valid_output_div").html('<div class="row head_valid_details">'+
                    '<div class="col-lg-1">#</div>'+
                    '<div class="col-lg-3">Message</div>'+
                    '<div class="col-lg-7">Sentence</div>'+
                    '<div class="col-lg-1"></div>'+
                '</div>');
            
            for (v_i in V[_idv]["errors"]){
                var e = V[_idv]["errors"][v_i];
                var action_btn = "";
                var check_div = "";
                if ("automatic_expresion" in e){
                    action_btn = '<button type="button" idA="'+e["idA"]+'" idv="'+_idv+'" ide="'+v_i+'"  class="btn btn-secondary valid_btn_fix" data-toggle="tooltip" title="Fix this error automatically"><i class="glyphicon glyphicon-wrench"></i></button>';
                    check_div = '<input class="checkbox_valid_details" type="checkbox" idv="'+_idv+'" ide="'+v_i+'"/>';
                    
                }
                
                if (e["status"] == "corrected"){
                    action_btn = '<i class="glyphicon glyphicon-ok-sign my-form-control" style="color:#337ab7;"></i>';
                    check_div = "";
                }              
                
                
                $("#valid_output_div").append('<div class="row item_valid_details">'+
                            '<div class="col-lg-1">'+e["position"]+' '+check_div+'</div>'+
                            '<div class="col-lg-3">'+e["error_detail"]+'</div>'+
                            ((!("idA" in e))?'<div class="col-lg-7"></div><div class="col-lg-1 text-rigth"> </div>':
                            '<div class="col-lg-7">'+valid_idSentence2html(e["id_sentence"],e["uridoc"])+'</div>'+
                            '<div class="col-lg-1 text-rigth"> '+action_btn+' </div>') +
                    '</div>');
            }
        }
    }
    
    
    $(document).on('click', '.valid_btnDescription', function () {
        valid_idvToShow = $(this).attr("idv");
        valid_showContent();
        
    });
    
    
    setAsCorrected = function(_ide_,_idv_){
        if (_idv_ in V && "errors" in V[_idv_]){
                var e = V[_idv_]["errors"][_ide_];
                var _ida_ = e["idA"];
                e["status"] = "corrected";
        }    
    }
    
    textBetween = function(txt,ch1,ch2){
        if (txt.length == 0){return "";}
        var ppi = 0;
        var found = false;
        var begin = false;
        if (ch1 == "\n"){  // if the start char is \n then start the text from the beggining
            begin = true;
        }
        var ss = "";
        while (!found && ppi < txt.length){
            if (begin==false && txt[ppi] == ch1){
                begin = true;
            }
            else if (begin==true){
                if (txt[ppi] == ch2){
                    return ss;
                }
                ss = ss.concat(txt[ppi]);
            }
            ppi = ppi +1;
        }
        return ss;
    }
    
    
    valid_delete_tags = function(Tags, L){
        var R_tags = [];
        for (vt_i in Tags){
            var vt_t = Tags[vt_i];
            var found = false;
            for (vt_j in L){
                var vt_t1 = L[vt_j];
                if (vt_t == vt_t1){
                    found = true;
                    break;
                }
            }
            
            if (found == false){
                R_tags.push(vt_t);
            }
        }
        return R_tags;
    }
    
    
    valid_add_if_not_contains = function(Tags, L){
        var R_tags = [];
        for (vt_i in Tags){
            var vt_t = Tags[vt_i];
            R_tags.push(vt_t);
        }
        
        for (vt_i in L){
            var vt_l = L[vt_i];
            var found = false;
            for (vt_j in Tags){
                var vt_t = Tags[vt_j];
                if (vt_l == vt_t){
                    found = true;
                    break;
                }
            }
            
            if (found == false){
                R_tags.push(vt_l);
            }
        }
        return R_tags;
    }
    
    
    valid_fix_error = function(exp,f_e,vidv){

            //eliminations
            if (exp.indexOf("(")!=-1){
                var L = textBetween(exp,"(",")").split(",");
                var ann = A[f_e["idA"]];
                if ("tag" in ann){
                    ann["tag"] = valid_delete_tags(ann["tag"], L);
                }                
            }
            

            if (exp.indexOf("[")!=-1){
                var L = textBetween(exp,"[","]").split(",");
                var ann = A[f_e["idA"]];
                console.log(["ann:",ann]);
                ann["tag"] = valid_add_if_not_contains(ann["tag"],L);
            }
    }
    
    $(document).on('click', '.valid_btn_fix', function () {
        var vidv = $(this).attr("idv");
        var vide = $(this).attr("ide");
        
        var f_e = V[vidv]["errors"][vide];
        if ("automatic_expresion" in f_e){
            var exp_ = f_e["automatic_expresion"];
            valid_fix_error(exp_,f_e,vidv);
            setAsCorrected(vide,vidv);
            valid_idvToShow = vidv;
            valid_showContent();
            buildNIFCorpora();
        }
        
    });
    
    
    $("#valid_select_all_check").click(function(){
        $('.checkbox_valid_details').prop('checked', true);
    });
    
    
    $("#valid_fix_all").click(function(){
        $(".checkbox_valid_details").each(function() {
            var isChecked = $(this).prop('checked');
            if(isChecked == true){
                var vidv = $(this).attr("idv");
                var vide = $(this).attr("ide");
                
                var f_e = V[vidv]["errors"][vide];
                if ("automatic_expresion" in f_e){
                    var exp_ = f_e["automatic_expresion"];
                    valid_fix_error(exp_,f_e,vidv);
                    setAsCorrected(vide,vidv);
                }
            }            
        });        
        valid_showContent();
        buildNIFCorpora();
    });
    
    
    $("#vald_rules_validate").click(function(){
        var newidV = 1;
        var Vkey = Object.keys(V);
        if (Vkey.length != 0){
            newidV = parseInt(Vkey[Vkey.length-1])+1;
        }
        
        var constrain = $("#vald_firstRule").val();
        if (constrain == undefined || constrain == ""){
            warning_alert("You have to specify a constrain!");
            return false;
        }
        
        var exp = $("#vald_SecondRule").val();
        if (exp == undefined || exp == ""){
            warning_alert("You have to specify an expresion!");
            return false;
        }
        
        var str_constrain = constrain.replace("<","&lt;");
        str_constrain = str_constrain.replace(">","&gt;");
        V[newidV] = {
            "name":"Dinamic RULE #"+newidV,
            "date":"-",
            "time":"-",
            "description":str_constrain+"%"+exp,
            "number_errors":"-",
            "errors":[],
            "type":"dinamic",
            "automatic_expresion": constrain+"%"+exp
        };
        
        updateMainTableValidation();
        $("#vald_firstRule").val("");
        $("#vald_SecondRule").val("");
    });
    
    
    
    
    
    ///--- download in the System tab
    $("#sys_download_nif").click(function(){
        if ('Blob' in window) {
            BootstrapDialog.show({
                message: '<label for="filename_input_sys_down" class="col-form-label">File Name:</label> ' +
                        '<input type="text" class="form-control espacioAbajo" id="filename_input_sys_down" '+
                        'placeholder="Name of the file">',
                title: 'File Name Input',
                buttons: [{
                    label: 'Close',
                    action: function(dialog) {
                        dialog.close();
                    }
                }, {
                    label: 'Ok',
                    action: function(dialog) {
                        var fileName = $("#filename_input_sys_down").val();
                        if (fileName) {
                            //var htmlText = $('#nifdoc').html();
                            //htmlText = replaceAll(htmlText,"&nbsp;"," ");
                            //var textToWrite = Encoder.htmlDecode(replaceAll(htmlText,"<br>","\n"));
                            textToWrite = CreateEnvironmentSystem();
                            var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
                            if ('msSaveOrOpenBlob' in navigator) {
                                navigator.msSaveOrOpenBlob(textFileAsBlob, fileName);
                            } else {
                                var downloadLink = document.createElement('a');
                                downloadLink.download = fileName;
                                downloadLink.innerHTML = 'Download File';
                                if ('webkitURL' in window) {
                                    // Chrome allows the link to be clicked without actually adding it to the DOM.
                                    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                                } else {
                                    // Firefox requires the link to be added to the DOM before it can be clicked.
                                    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                                    downloadLink.onclick = function(){};
                                    downloadLink.style.display = 'none';
                                    document.body.appendChild(downloadLink);
                                }
                            downloadLink.click();
                            }
                        }
                        dialog.close();
                    }
                }]
            });
        
        } else {
        alert('Your browser does not support the HTML5 Blob.');
        }
    });
    
    
    CreateEnvironmentSystem = function(){
        var doc = document.implementation.createDocument("", "", null);
        var envElem = doc.createElement("environment");
        
        // docs
        var docElem = doc.createElement("doc");
        for (i in sysD){
            var d = sysD[i];
            console.log(d);
            
            var docItemElem = doc.createElement("docItem");
            docItemElem.setAttribute("inDocCounter", d["inDocCounter"]);
            docItemElem.setAttribute("uri", d["uri"]);
            docElem.appendChild(docItemElem);
        }        
        envElem.appendChild(docElem);
        
        // sentences
        var sentElem = doc.createElement("sentences");
        for (i in sysSentences){
            var sent = sysSentences[i];
            console.log(sent);
            
            var sentItemElem = doc.createElement("sentenceItem");
            var sent_ = replaceAll(sent["text"],'"',"'");
            sentItemElem.setAttribute("text",   sent_);
            sentItemElem.setAttribute("uridoc", sent["uridoc"]);
            sentElem.appendChild(sentItemElem);
        }        
        envElem.appendChild(sentElem);
        

        // Annotations
        var annElem = doc.createElement("annotations");
        for (i in sysA){
            var ann = sysA[i];
            console.log(ann);
            
            var annItemElem = doc.createElement("annotationItem");
            annItemElem.setAttribute("idA",   ann["idA"]);
            annItemElem.setAttribute("uridoc", ann["uridoc"]);
            annItemElem.setAttribute("id_sentence", ann["id_sentence"]);            
            annItemElem.setAttribute("ini", ann["ini"]);   
            annItemElem.setAttribute("fin", ann["fin"]);   
            
            
            if ("tag" in ann){
                var tagAnnElem = doc.createElement("tagAnnItem");  
                for (j in ann["tag"]){
                    var tt = ann["tag"][j];             
                    var tagElement = doc.createElement("tagAnnItemElement");
                    tagElement.setAttribute("tag", tt);
                    tagAnnElem.appendChild(tagElement);
                }
                annItemElem.appendChild(tagAnnElem);
                
            }
            
            var uriAnnElem = doc.createElement("uriAnnItem");  
            for (j in ann["uri"]){
                var tt = ann["uri"][j];             
                var uriElement = doc.createElement("uriAnnItemElement");
                uriElement.setAttribute("uri", tt);
                uriAnnElem.appendChild(uriElement);
            }
            annItemElem.appendChild(uriAnnElem);
            annElem.appendChild(annItemElem);
        }        
        envElem.appendChild(annElem);
        
        
        
        
        doc.appendChild(envElem);
        
        var xml_str = '<?xml version="1.0" encoding="UTF-8"?>';
        var xml_body = new XMLSerializer().serializeToString(doc);
        return xml_str + xml_body;
    }
    
    
    
    ///--- upload in the System tab
    typeUpload = "main";
    $("#sys_upload_nif").click(function(){
        typeUpload="sys";
        $("#modalUpload").modal("show");
    });
    
    
    parseSystemsInput = function(){
        console.log(["textFromUpload:",textFromUpload]);
        D = {};
        var text = undefined;
        text = textFromUpload;
        textFromUpload = undefined;
        
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(text,"text/xml");
        
        // docs
        var docItem = xmlDoc.getElementsByTagName("docItem");
        sysD = [];
        console.log(["docItem.length:",docItem.length]);
        for (var di = 0; di < docItem.length; di++){
            var doc = docItem[di];
            console.log("--- new doc ---");
            
            newDoc = {};
            for (var j = 0; j < doc.attributes.length; j++) {
                var attribute = doc.attributes.item(j);
                newDoc[attribute.nodeName] = attribute.nodeValue;
            }
            sysD.push(newDoc);
        } 
        
        
        // sentences
        var sentenceItem = xmlDoc.getElementsByTagName("sentenceItem");
        sysSentences = [];
        for (var di = 0; di < sentenceItem.length; di++){
            var sent = sentenceItem[di];
            console.log("--- new sentence ---");    
            newSentence = {};
            for (var j = 0; j < sent.attributes.length; j++) {
                var attribute = sent.attributes.item(j);
                newSentence[attribute.nodeName] = attribute.nodeValue;
            }
            sysSentences.push(newSentence);
        }
        
        
        // annotation
        var annotationItem = xmlDoc.getElementsByTagName("annotationItem");
        sysA = [];
        for (var di = 0; di < annotationItem.length; di++){
            var ann = annotationItem[di];
            console.log("--- new annotation ---");    
            newA = {};
            for (var j = 0; j < ann.attributes.length; j++) {
                var attribute = ann.attributes.item(j);
                newA[attribute.nodeName] = attribute.nodeValue;
            }
            newA["ini"] = parseInt(newA["ini"]);
            newA["fin"] = parseInt(newA["fin"]);
            
            console.log("............");
            if (ann.hasChildNodes()) {
                for(var i = 0; i < ann.childNodes.length; i++) {
                    var item = ann.childNodes.item(i);
                    var nodeName = item.nodeName;
                    console.log(["nodeName:",nodeName]);
                    if (nodeName == "tagAnnItem"){
                        if (item.hasChildNodes()) {
                            for(var k = 0; k < item.childNodes.length; k++) {
                                var elem = item.childNodes.item(k);
                                var nodeName = elem.nodeName;
                                if (nodeName == "tagAnnItemElement"){
                                    newTag = {};
                                    for (var j = 0; j < elem.attributes.length; j++) {
                                        var attribute = elem.attributes.item(j);
                                        newTag[attribute.nodeName] = attribute.nodeValue;
                                    }
                                    
                                    if (!("tag" in newA)){
                                        newA["tag"] = [];
                                    }
                                    console.log(newTag);
                                    newA["tag"].push(newTag["tag"]);
                                }                    
                            }                
                        }
                    }
                    else if (nodeName == "uriAnnItem"){
                        if (item.hasChildNodes()) {
                            console.log(["cantUri:",item.childNodes.length]);
                            for(var k = 0; k < item.childNodes.length; k++) {
                                var elem = item.childNodes.item(k);
                                var nodeName = elem.nodeName;
                                console.log(["nameURI:",nodeName]);
                                if (nodeName == "uriAnnItemElement"){
                                    newUri = {};
                                    for (var j = 0; j < elem.attributes.length; j++) {
                                        var attribute = elem.attributes.item(j);
                                        newUri[attribute.nodeName] = attribute.nodeValue;
                                    }
                                    
                                    console.log(["uri",newUri]);
                                    
                                    if (!("uri" in newA)){
                                        newA["uri"] = [];
                                    }
                                    newA["uri"].push(newUri["uri"]);
                                }                    
                            }                
                        }
                    }
                }                
            }
            sysA.push(newA);
        }
        
        for (iddoc in sysD){
            add_annotations_to_display(iddoc);
        }        
    }
   
   
    
});





