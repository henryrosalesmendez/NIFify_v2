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



    $("#btn_1_split").click(function(){
 
         var text = $("#inDoc").val();
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
         $("#inDoc").val(res);
         ///////$(this).prop( "disabled", true ); //Disable
         ///////$("#btn_2_acept_sent").prop( "disabled", false ); //Enable
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
                    console.log("typeMention -->",typeMention)
                    if (typeMention != '- Select Type -'){
                        link2type[text] = w2type[typeMention];
                        console.log(text,"----->",typeMention);
                    }
                //}
            });

            // OJOOOO
            var in_uri = $("#modalSelectURI").val();
            if (in_uri){
                list_uri.push(in_uri);
                var typeMention = $("#modalSelectURI").attr("mentiontype");
                console.log("PPPPPPPRRRRRRRIIIIIIIIIMMMMMMEEEEERRRRRAAAA:",typeMention)
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
            
            
            
        //}
        temp_annotation["idA"] = A.length;
        temp_annotation["uridoc"] = Sentences[temp_annotation["id_sentence"]]["uridoc"];
        A.push(temp_annotation);
       $('#myModal').modal("hide"); 
       buildNIFCorpora();
       remove_input_uris();
    });




    uridoc2id = function(uridoc){
        for (d in D){
            doc = D[d];
            if (doc["uri"] == uridoc){
                var _inDocCounter = doc["inDocCounter"];
                return _inDocCounter;
            }
        }
        return "";
    }


    id2text = function(_inDocCounter){
        var text = $("#inDoc"+_inDocCounter).val();
        return text;
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
                console.log(text,"----->",typeMention);
            }
            
        });

        var in_uri = $("#modalSelectURI").val();
        if (in_uri){
            list_uri.push(in_uri);
            
            var typeMention = $("#modalSelectURI").attr("mentiontype");
            console.log("PPPPPPPRRRRRRRIIIIIIIIIMMMMMMEEEEERRRRRAAAA:",typeMention)
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
            
        
        temp_annotation["idA"] = A.length;
        temp_annotation["uridoc"] = Sentences[temp_annotation["id_sentence"]]["uridoc"];
        A.push(temp_annotation);
        $('#myModal').modal("hide");



        // seach the other mentions of this surface form
        var allow_overlaps = $("#cbox_overlaps").prop("checked");
        var t = temp_annotation["label"];
        var t_len = t.length;
        _inDocCounter = uridoc2id(temp_annotation["uridoc"]);
        var txt = id2text(_inDocCounter)
        var p = txt.indexOf(t);
        var overall = 0;
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
                  A.push({
                      "ini":ini, 
                      "fin":fin, 
                      "uri":list_uri, 
                      "id_sentence": ids,
                      "uridoc":temp_annotation["uridoc"],
                      //"uridoc": Sentences[ids]["uridoc"],
                      "label":t,
                      "idA": A.length
                  });
                  
                  if ("tag" in temp_annotation){ 
                      A["tag"] = temp_annotation["tag"];                      
                  }
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
            console.log("PPPPPPPRRRRRRRIIIIIIIIIMMMMMMEEEEERRRRRAAAA:",typeMention)
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
        
        temp_annotation["idA"] = A.length;
        temp_annotation["uridoc"] = Sentences[temp_annotation["id_sentence"]]["uridoc"];
        A.push(temp_annotation);
        $('#myModal').modal("hide");



        // seach the other mentions of this surface form
        var allow_overlaps = $("#cbox_overlaps").prop("checked");
        var t = temp_annotation["label"];
        var t_len = t.length;
        for (d in D){
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
                    console.log("1");
                    console.log(goahead);
                }
                else{
                    goahead = !existsOverlapping({"ini":ini, "fin":fin, "uridoc":doc["uri"]});
                    console.log("2");
                    console.log(goahead);
                }

                if (goahead){
                //if (posInA == -1){ 
                  if ( (p==0 || txt[p-1] in punctuationsSign) && (p+t_len==txt.length || txt[p+t_len] in punctuationsSign) ){
                      var ids = sent2id(ini,_inDocCounter);
                      A.push({
                          "ini":ini, 
                          "fin":fin, 
                          "uri":list_uri, 
                          "id_sentence": ids,
                          "uridoc":doc["uri"],
                          //"tag": temp_annotation["tag"],
                          //"uridoc": Sentences[ids]["uridoc"],
                          "label":t,
                          "idA": A.length
                      });
                      
                      if ("tag" in temp_annotation){ 
                          A["tag"] = temp_annotation["tag"];                      
                      }
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
           
           var _html = '<div class="row parent_div_show drop-shadow">'+
        '<div style="class="col-lg-12">'+
            '<div id="doc'+inDocCounter+'" class="row">'+
                '<div class="col-lg-6">'+
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
                       if (ann["fin"]==e["fin"]){
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
                     
                     if (_filter.length != 0){
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
                         console.log("ann:::::",ann);
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
                     console.log(ttype);
                     if ( ttype != undefined){
                       mentionType = '<i class="glyphicon '+type2icon[ttype]+'"></i>&nbsp;';  
                     }
                     //--
                     httpAnnotation = '<span ide="'+ann["idA"]+'"  class="blueLabel classlabelAnnotation"  data-toggle="tooltip" title="'+ann["uri"].join()+'" '+st+'>'+mentionType+label+'</span>';
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
                     
                     if (_filter.length != 0){
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
                                     "        nif:endIndex \""+fin_t+"\"^^xsd:nonNegativeInteger ;\n";
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
        //$.blockUI();
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
        //$.unblockUI();
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
        allowedFileExtensions: ["ttl", "rdf"]
        //uploadUrl: '/site/file-upload-single'
    });

    var upload = function() {
		var photo = document.getElementById("fileNif");
		return false;
	};

    /*** probandoo
    file_temp = undefined;
    function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

    function receivedText() {
            showResult(fr, "Text");
        }
    function showResult(fr, label) {

        var result = fr.result;
	console.log(result);
	textFromUpload = result;
	CleanAnnotationDocument();
	$("#btn_inputNIF").click();
	//var htmle = Encoder.htmlEncode(result,true);
	//$("#nifdoc").html("BBB-->"+htmle);
	//textFromUpload = result;
    }

    function bodyAppend(tagName, innerHTML) {
        var elm;

        elm = document.createElement(tagName);
        elm.innerHTML = innerHTML;
        document.body.appendChild(elm);
    }

    
    **/

//e.target.
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
                //fr.onload = receivedText;
		fr.onload = function(e){
		    var result = e.target.result;
		    //console.log(result);
		    textFromUpload = e.target.result;
		    CleanAnnotationDocument();
		    $("#btn_inputNIF").click();
		}
                fr.readAsText(file);
	  }
	  
	  $('#modalUpload_upload').click(function(evt) {
         /*warning_alert("It's not working yet :(, you should try to copy/paste the nif content in the text area and apply the next button");
		/**/if (evt.target.tagName.toLowerCase() == 'button') {
		  var startByte = evt.target.getAttribute('data-startbyte');
		  var endByte = evt.target.getAttribute('data-endbyte');
		  readBlob(startByte, endByte);
		}
        $("#divShow").removeClass("hide");/**/
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
    
    $("#btn_inputNIF").click(function(){   // que no necesite star ordenado el fichero
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
                var n_chunk = chunk.length;
                if (chunk.indexOf("mnt:entityType")!=-1){ // entity type
                    var trp = chunk.split("mnt:entityType");
                    console.log("trp:",trp,"   trp.length:",trp.length);
                    if (trp.length == 2){
                        var s = trim_1(trp[0]);
                        console.log("s:",s);
                        
                        var o = trim_1(trp[1]);
                        console.log("o:",o);
                        link2type[s] = o;
                    }
                    
                }
                else if (chunk.indexOf("nif:sourceUrl")!=-1){ // Document
                    var u_text = chunk.substring(p_ref, n_chunk);
                    var i_number = u_text.indexOf("<");
                    var p_number = u_text.indexOf("#");
                    if (p_number != -1){
                        uridoc = u_text.substring(i_number + 1,p_number); // 22
                    }
                    else {
                        var p_number = u_text.indexOf(">");
                        uridoc = u_text.substring(i_number + 1,p_number); // 8
                    }
                    
                    D.push({"uri":uridoc, "inDocCounter":inDocCounter});
                    dicc_uri2inDocCounter[uri] = inDocCounter;
                    inDocCounter = inDocCounter +1;
                    overall = 0;
                    
                    chunk = "";
                    continue;
                }
                var p_ref = chunk.indexOf("nif:referenceContext");
                var p_bro = chunk.indexOf("nif:broaderContext");
                if (p_ref!=-1  || p_bro!=-1 ){  // it is a Setence or an Annotation (nif:Phrase)
                    if (chunk.indexOf("@prefix")!=-1){continue;}
                    if (chunk.indexOf("nif:Phrase")!=-1){  // It's an Annotation

                        // -- nif:beginIndex
                        var p_beginIndex = chunk.indexOf("nif:beginIndex");
                        if (p_beginIndex == -1){
                            console.log("--->> Error, there musts be a nif:beginIndex triple (start)");
                            continue;
                        }
                        
                        
                        var r_text = chunk.substring(p_beginIndex, n_chunk);
                        var fin_beginIndex = r_text.indexOf('"^^xsd:');
                        if (fin_beginIndex == -1){
                            //console.log(chunk + "\n----------------\n");
                            console.log("--->> Error, there musts be a nif:beginIndex triple (end)");
                            continue;
                        }
                        var startPosition = r_text.substring(16,fin_beginIndex);

                        // -- nif:endIndex
                        var p_endIndex = chunk.indexOf("nif:endIndex");
                        if (p_endIndex == -1){
                            console.log("--->> Error, there musts be a nif:endIndex triple (start)");
                            continue;
                        }
                        
                        var r_text = chunk.substring(p_endIndex, n_chunk);
                        var fin_endIndex = r_text.indexOf('"^^xsd:');//('"^^xsd:nonNegativeInteger');
                        if (fin_endIndex == -1){
                            console.log("--->> Error, there musts be a nif:endIndex triple (end)");
                            continue;
                        }
                        var endPosition = r_text.substring(14,fin_endIndex);


                       //--- nif:anchorOf
                        var p_anchorOf = chunk.indexOf("nif:anchorOf");
                        if (p_anchorOf == -1){
                            console.log("--->> Error, there musts be a nif:anchorOf triple (start)");
                            continue;
                        }
                        
                        var r_text = chunk.substring(p_anchorOf, n_chunk);
                        var label = "";
                        var fin_anchorOf = r_text.indexOf('"""^^xsd:string');
                        if (fin_anchorOf == -1){
                            var fin_anchorOf = r_text.indexOf('"^^xsd:string');
                            if (fin_anchorOf == -1){
                                console.log(chunk);
                                console.log("r_text:"+r_text);
                                console.log("--->> Error, there musts be a nif:anchorOf triple (end)");
                                continue;
                            }
                            label = r_text.substring(14,fin_anchorOf);
                            //console.log("label:"+label);
                        }
                        else {
                            label = r_text.substring(16,fin_anchorOf);
                        }



                        //uri itsrdf:taIdentRef
                        var p_taIdentRef = chunk.indexOf("itsrdf:taIdentRef");
                        if (p_taIdentRef == -1){
                            console.log("--->> Error, there musts be a nif:taIdentRef triple (start)");
                            continue;
                        }
                        
                        // get the list of links
                        var list_uri = [];
                        var r_text = chunk.substring(p_taIdentRef, n_chunk);
                        var terminate = false;
                        while (!terminate){
                            var fin_taIdentRef = r_text.indexOf('>');
                            if (fin_taIdentRef == -1){
                                console.log("--->> Error, there musts be a nif:taIdentRef triple (end)");
                                continue;
                            }
                            else{
                                var uri = "";
                                if (r_text[0]=="<"){ // other object for the same predicate
                                    uri = r_text.substring(1,fin_taIdentRef);
                                }
                                else{
                                    uri = r_text.substring(19,fin_taIdentRef);                                    
                                }
                                list_uri.push(uri);
                            }
                            
                            // what's next, either ',' , itsrdf:taIdentRef ?? , or other predicate
                            var k = fin_taIdentRef+1;
                            while (k<r_text.length && r_text[k]==" "){
                                k = k +1;
                            }
                            
                            if (r_text[k] == ","){                                
                                var p_ini = r_text.indexOf('<');
                                if (p_ini == -1){
                                    console.log("--->> Error, there musts be a nif:taIdentRef triple (end-1)");
                                    continue;
                                }
                                else{
                                    r_text = chunk.substring(p_taIdentRef+k, n_chunk);
                                }
                            }
                            else if (r_text[k] == ";"){ // then it is other predicate, we will se if there are other itsrdf:taIdentRef
                                var r_text_temp = chunk.substring(p_taIdentRef+k, n_chunk);
                                var t  = r_text_temp.indexOf("itsrdf:taIdentRef");
                                if (t == -1){
                                    terminate = true;
                                }
                                else {
                                    p_taIdentRef = p_taIdentRef+t+k;
                                    r_text = chunk.substring(p_taIdentRef, n_chunk);
                                }
                            } else{terminate = true;}
                        }
                        

                        var id_s_t = id_s-1
                        //console.log("=====>",startPosition,parseInt(startPosition), endPosition, parseInt(endPosition));
                        ann = {   // esta variable global la voy a completar cuando  llene el URI y a taxonomia en el modal
                                  "ini":parseInt(startPosition) + overall - sent_text.length-1,
                                  "fin":parseInt(endPosition)+ overall - sent_text.length-1,
                                  "id_sentence":id_s_t.toString(),
                                  "label":label,
                                  "uri": list_uri
                        };


                        //itsrdf:taClassRef nerd:AdministrativeRegion ;
                        var p_taClassRef = chunk.indexOf("itsrdf:taClassRef");
                        //console.log("p_taClassRef",p_taClassRef);
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
                            
                            //console.log("tag:",tag);
                            // ----- esto comentado lo que hace es incluir en el taxonomyIput principal solo Ambiguos.. esto deberia generaliarse y ahcerse para que todos los tag escogidos se pongan ahi
                            /*
                            if (tag == "tax:Ambiguous"){
                                $("#taxonomyInput").select2("val",19); // fijo, hay que ponerlo dinamico
                            }*/
                        }
                        ann["idA"] = A.length;
                        ann["uridoc"] = Sentences[id_s_t]["uridoc"];
                        A.push(ann);
                    }
                    else{ // it's  Sentence

                        // text's sentence
                        var p_isString = chunk.indexOf("nif:isString");
                        if (p_isString == -1){
                            console.log("--->> Error, there musts be a nif:isString triple (start)");
                            continue;
                        }
                        
                        var r_text = chunk.substring(p_isString, n_chunk);
                        var fin_isString = r_text.indexOf('"""^^xsd:string');
                        if (fin_isString == -1){
                            var fin_isString = r_text.indexOf('"^^xsd:string');
                            if (fin_isString == -1){
                                console.log("--->> Error, there musts be a nif:isString triple (end)");
                                continue;
                            } else {
                                sent_text = r_text.substring(14,fin_isString);
                            }
                            
                        }
                        else{
                            sent_text = r_text.substring(16,fin_isString);
                        }
                        
                        ///////Sentences.push(sent_text);


                        // uri's sentence 
                        sent_uri = chunk.substring(1,chunk.indexOf("#"));

                        // sent_ini and send_fin are not used yet
                        var sent_ini = 0;
                        var sent_fin = 0;
                         
                        //uridoc
                        if (uridoc==""){
                            var u_text = chunk.substring(p_ref, n_chunk);
                            var i_number = u_text.indexOf("<http");
                            var p_number = u_text.indexOf("#");
                            if (p_number != -1){
                                uridoc = u_text.substring(i_number + 1,p_number); // 22
                            }
                            else {
                                var p_number = u_text.indexOf(">");
                                uridoc = u_text.substring(i_number + 1,p_number); // 8
                            }
                            $("#inIdDoc").val(uridoc);
                        }
                        Sentences.push({"text":sent_text, "uridoc":uridoc});
                        ///////////idSentence2dicc[id_s] = {"uri": sent_uri, "ini":sent_ini, "fin":sent_fin, "len":sent_text.length};
                        id_s = id_s + 1;
                        overall = overall + sent_text.length +1;
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
        ////$("#inDoc").prop("readonly",true);
        ///////$("#btn_3_annotation").prop( "disabled", false ); //Enable
        ///////$("#btn_4_annotation").prop( "disabled", false ); //Enable
        ///////$("#btn_1_split").prop( "disabled", true ); //Disable


       //Update show-divs
       buildNIFCorpora();     
    });

    
    
    // We suppose that the sentences are ordered
    
    textFromUpload = undefined;
    /*$("#btn_inputNIF").click(function(){
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
        
        Sentences = [];
        for (i in L){
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
                var n_chunk = chunk.length;
                if (chunk.indexOf("nif:sourceUrl")!=-1){ // Document
                    var u_text = chunk.substring(p_ref, n_chunk);
                    var i_number = u_text.indexOf("<");
                    var p_number = u_text.indexOf("#");
                    if (p_number != -1){
                        uridoc = u_text.substring(i_number + 1,p_number); // 22
                    }
                    else {
                        var p_number = u_text.indexOf(">");
                        uridoc = u_text.substring(i_number + 1,p_number); // 8
                    }
                    $("#inIdDoc").val(uridoc);
                    chunk = "";
                    continue;
                }
                var p_ref = chunk.indexOf("nif:referenceContext");
                var p_bro = chunk.indexOf("nif:broaderContext");
                if (p_ref!=-1  || p_bro!=-1 ){  // it is a Setence or an Annotation (nif:Phrase)
                    if (chunk.indexOf("@prefix")!=-1){continue;}
                    if (chunk.indexOf("nif:Phrase")!=-1){  // It's an Annotation

                        // -- nif:beginIndex
                        var p_beginIndex = chunk.indexOf("nif:beginIndex");
                        if (p_beginIndex == -1){
                            console.log("--->> Error, there musts be a nif:beginIndex triple (start)");
                            continue;
                        }
                        
                        
                        var r_text = chunk.substring(p_beginIndex, n_chunk);
                        var fin_beginIndex = r_text.indexOf('"^^xsd:');
                        if (fin_beginIndex == -1){
                            console.log(chunk + "\n----------------\n");
                            console.log("--->> Error, there musts be a nif:beginIndex triple (end)");
                            continue;
                        }
                        var startPosition = r_text.substring(16,fin_beginIndex);

                        // -- nif:endIndex
                        var p_endIndex = chunk.indexOf("nif:endIndex");
                        if (p_endIndex == -1){
                            console.log("--->> Error, there musts be a nif:endIndex triple (start)");
                            continue;
                        }
                        
                        var r_text = chunk.substring(p_endIndex, n_chunk);
                        var fin_endIndex = r_text.indexOf('"^^xsd:');//('"^^xsd:nonNegativeInteger');
                        if (fin_endIndex == -1){
                            console.log("--->> Error, there musts be a nif:endIndex triple (end)");
                            continue;
                        }
                        var endPosition = r_text.substring(14,fin_endIndex);


                       //--- nif:anchorOf
                        var p_anchorOf = chunk.indexOf("nif:anchorOf");
                        if (p_anchorOf == -1){
                            console.log("--->> Error, there musts be a nif:anchorOf triple (start)");
                            continue;
                        }
                        
                        var r_text = chunk.substring(p_anchorOf, n_chunk);
                        var label = "";
                        var fin_anchorOf = r_text.indexOf('"""^^xsd:string');
                        if (fin_anchorOf == -1){
                            var fin_anchorOf = r_text.indexOf('"^^xsd:string');
                            if (fin_anchorOf == -1){
                                console.log(chunk);
                                console.log("r_text:"+r_text);
                                console.log("--->> Error, there musts be a nif:anchorOf triple (end)");
                                continue;
                            }
                            label = r_text.substring(14,fin_anchorOf);
                            console.log("label:"+label);
                        }
                        else {
                            label = r_text.substring(16,fin_anchorOf);
                        }



                        //uri itsrdf:taIdentRef
                        var p_taIdentRef = chunk.indexOf("itsrdf:taIdentRef");
                        if (p_taIdentRef == -1){
                            console.log("--->> Error, there musts be a nif:taIdentRef triple (start)");
                            continue;
                        }
                        
                        // get the list of links
                        var list_uri = [];
                        var r_text = chunk.substring(p_taIdentRef, n_chunk);
                        var terminate = false;
                        while (!terminate){
                            var fin_taIdentRef = r_text.indexOf('>');
                            if (fin_taIdentRef == -1){
                                console.log("--->> Error, there musts be a nif:taIdentRef triple (end)");
                                continue;
                            }
                            else{
                                var uri = "";
                                if (r_text[0]=="<"){ // other object for the same predicate
                                    uri = r_text.substring(1,fin_taIdentRef);
                                }
                                else{
                                    uri = r_text.substring(19,fin_taIdentRef);                                    
                                }
                                list_uri.push(uri);
                            }
                            
                            // what's next, either ',' , itsrdf:taIdentRef ?? , or other predicate
                            var k = fin_taIdentRef+1;
                            while (k<r_text.length && r_text[k]==" "){
                                k = k +1;
                            }
                            
                            if (r_text[k] == ","){                                
                                var p_ini = r_text.indexOf('<');
                                if (p_ini == -1){
                                    console.log("--->> Error, there musts be a nif:taIdentRef triple (end-1)");
                                    continue;
                                }
                                else{
                                    r_text = chunk.substring(p_taIdentRef+k, n_chunk);
                                }
                            }
                            else if (r_text[k] == ";"){ // then it is other predicate, we will se if there are other itsrdf:taIdentRef
                                var r_text_temp = chunk.substring(p_taIdentRef+k, n_chunk);
                                var t  = r_text_temp.indexOf("itsrdf:taIdentRef");
                                if (t == -1){
                                    terminate = true;
                                }
                                else {
                                    p_taIdentRef = p_taIdentRef+t+k;
                                    r_text = chunk.substring(p_taIdentRef, n_chunk);
                                }
                            } else{terminate = true;}
                        }
                        
                        var id_s_t = id_s-1
                        //console.log("=====>",startPosition,parseInt(startPosition), endPosition, parseInt(endPosition));
                        ann = {   // esta variable global la voy a completar cuando  llene el URI y a taxonomia en el modal
                                  "ini":parseInt(startPosition) + overall - sent_text.length-1,
                                  "fin":parseInt(endPosition)+ overall - sent_text.length-1,
                                  "id_sentence":id_s_t.toString(),
                                  "label":label,
                                  "uri": list_uri
                        };


                        //itsrdf:taClassRef nerd:AdministrativeRegion ;
                        var p_taClassRef = chunk.indexOf("itsrdf:taClassRef");
                        //console.log("p_taClassRef",p_taClassRef);
                        if (p_taClassRef != -1){
                            var r_text = chunk.substring(p_taClassRef, n_chunk);
                            var fin_taClassRef = r_text.indexOf(';');
                            if (fin_taClassRef == -1){
                                console.log("--->> Error, there musts be a nif:taClassRef triple (end)");
                                continue;
                            }
                            var tag = r_text.substring(18,fin_taClassRef);
                            tag = tag.trim();
                            //console.log("tag:",tag);
                            ann["tag"] = tag;
                            if (tag == "tax:Ambiguous"){
                                $("#taxonomyInput").select2("val",85); // fijo, hay que ponerlo dinamico
                            }
                        }
                        ann["idA"] = A.length;
                        A.push(ann);
                    }
                    else{ // it's  Sentence

                        // text's sentence
                        var p_isString = chunk.indexOf("nif:isString");
                        if (p_isString == -1){
                            console.log("--->> Error, there musts be a nif:isString triple (start)");
                            continue;
                        }
                        
                        var r_text = chunk.substring(p_isString, n_chunk);
                        var fin_isString = r_text.indexOf('"""^^xsd:string');
                        if (fin_isString == -1){
                            var fin_isString = r_text.indexOf('"^^xsd:string');
                            if (fin_isString == -1){
                                console.log("--->> Error, there musts be a nif:isString triple (end)");
                                continue;
                            } else {
                                sent_text = r_text.substring(14,fin_isString);
                            }
                            
                        }
                        else{
                            sent_text = r_text.substring(16,fin_isString);
                        }
                        
                        ///////Sentences.push(sent_text);


                        // uri's sentence 
                        sent_uri = chunk.substring(1,chunk.indexOf("#"));

                        // sent_ini and send_fin are not used yet
                        var sent_ini = 0;
                        var sent_fin = 0;
                         
                        //uridoc
                        if (uridoc==""){
                            var u_text = chunk.substring(p_ref, n_chunk);
                            var i_number = u_text.indexOf("<http");
                            var p_number = u_text.indexOf("#");
                            if (p_number != -1){
                                uridoc = u_text.substring(i_number + 1,p_number); // 22
                            }
                            else {
                                var p_number = u_text.indexOf(">");
                                uridoc = u_text.substring(i_number + 1,p_number); // 8
                            }
                            $("#inIdDoc").val(uridoc);
                        }
                        Sentences.push({"text":sent_text, "uridoc":uridoc});
                        ///////////idSentence2dicc[id_s] = {"uri": sent_uri, "ini":sent_ini, "fin":sent_fin, "len":sent_text.length};
                        id_s = id_s + 1;
                        overall = overall + sent_text.length +1;
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
        ////$("#inDoc").prop("readonly",true);
        ///////$("#btn_3_annotation").prop( "disabled", false ); //Enable
        ///////$("#btn_4_annotation").prop( "disabled", false ); //Enable
        ///////$("#btn_1_split").prop( "disabled", true ); //Disable


       //Update show-divs
       buildNIFCorpora();       
    });*/





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
        
        
        //--
        /*if ("tag" in ann){
            var listInputTaxonomy = $("#taxonomyInput").select2('data');
            for (k in listInputTaxonomy){
                var l = listInputTaxonomy[k];
                if (ann["tag"] == l["text"]){
                    $("#modalModifyAnnotationSelectTaxonomy").val(k);
                    break;
                }
            }
        }
        else{
            document.getElementById('modalModifyAnnotationSelectTaxonomy').selectedIndex = -1;
        }*/
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
          ///var html = $(".copy").html();
          console.log("--------> AQUIIIIIIIIIIIII");
          var id = $("#modalModifyAnnotationSelectURI").attr("number");
           var mtype = $("#modalModifyAnnotationSelectURI").attr("mentiontype");
          var text_type = "- Select Type -";
          if (mtype != text_type){
              var ttyp = w2type[mtype];
              if  ( ttyp != undefined){
                  text_type = '<i class="glyphicon '+type2icon[ttyp]+'"></i>'+mtype;
              }
          }
          /*var html ='<div class="control-group input-group taIdentRefContainer" style="margin-top:10px">'+
                      '<input id="annotation_'+id+'" type="text" name="addmore[]" class="form-control taIdentRef" placeholder="Enter Name Here">'+
                      '<div class="input-group-btn"> '+
                          '<button class="btn btn-danger remove" type="button"><i class="glyphicon glyphicon-remove"></i> Remove</button>'+
                      '</div>'+
                   '</div>';*/
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
                console.log("---------------------------------\n",text);
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
                    console.log("in_uri:",in_uri,"   w2type[typeMention]:",w2type[typeMention],"    typeMention:",typeMention);
                }
            }
            
               
            if (list_uri.length == 0){
                warning_alert("Debe de entrar una URI");
                return 0;
            }
            
            A[ide]["uri"] = list_uri;
 
            //console.log("in_uri:",in_uri);
            //warning_alert($("#modalSelectTaxonomy").val());
            /*var tax_val = $("#modalModifyAnnotationSelectTaxonomy").val();
            if (tax_val){
                if (parseInt(tax_val)!=1000){ // if it's not "-none-"
                    var listInputTaxonomy = $("#taxonomyInput").select2('data');
                    if (listInputTaxonomy.length >0){
                        var ann_tax_val = listInputTaxonomy[tax_val];
                        var tag_text = ann_tax_val["text"];
                        A[ide]["tag"] = tag_text;//$("#modalSelectTaxonomy").text();
                    }
                }
                else{
                    delete A[ide]["tag"];
                }
            }*/
            var list_tag = [];
            var listInputTaxonomy = $("#taxonomyMod").select2('data');        
            if (listInputTaxonomy.length != 0){
                for (i in listInputTaxonomy){
                    var v = listInputTaxonomy[i];
                    list_tag.push(v["text"])
                }
                A[ide]["tag"] = list_tag;
                console.log("actualizado");
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
    notAnnotatedYet = function(ini,fin){
      for (k in A){
          var ann = A[k];
          if (ann["ini"] == ini && ann["fin"] == fin){
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
    
    

});





















