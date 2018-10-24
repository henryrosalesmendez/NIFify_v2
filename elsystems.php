<?php
// you should asks to the mantainer for the API keys above.
$GLOBALS['APIKEY_BABELFY'] = "xxx";
$GLOBALS['APIKEY_FRED'] = "xxxxxxx";
$GLOBALS['APIKEY_TAGME2'] = "xxxxxx";
$GLOBALS['APIKEY_NERD']  = "xxxxx";


//-- Function to check if the request is an AJAX request
function is_ajax() {
  return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
}

function db2wiki($uriDBpedia, $lang){
    try {
        $line = explode("/", $uriDBpedia);
        return "https://".$lang.".wikipedia.org/wiki/".$line[sizeof($line)-1];
        //return $uriDBpedia;
    }
    catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
    return "";
}

//--
function Babelfy_with_concepts_response($data){ 
    try {
        ///--- get
        $text_coded = rawurlencode($data["text"]);
        //$text_coded = "Obama";
        $qry_str = "?text=".$text_coded."&lang=EN&key=".$GLOBALS['APIKEY_BABELFY'];
        //echo $qry_str;
        $ch = curl_init();

        // Set query data here with the URL
        curl_setopt($ch, CURLOPT_URL, 'https://babelfy.io/v1/disambiguate' . $qry_str); 

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $content = trim(curl_exec($ch));
        if (curl_errno($ch)) {
            echo '{"error":"'.curl_error($ch).'"}';
            return false;
        }

        curl_close($ch);
        //echo $content;
        
        if (gettype(strpos($content,"<html><head><title>"))!="boolean"){
            echo '{"error":"'.get_between($content,'<b>message</b> <u>','</u></p>').'"}';
            return false;
        }
        
        // processing json    var_dump
        $c =  json_decode($content,true);
        
        $response = "[";
        $first = true;
        foreach($c as $ann){
            //var_dump($ann);
            if ($first != true){
                $response = $response.",";
            }
            $first = false;
            $response = $response.'{"ini":'.$ann["charFragment"]["start"].",";
            $response = $response.'"fin":'.$ann["charFragment"]["end"].",";
            if ($ann["DBpediaURL"]){
                $response = $response.'"DBpediaURL":'.'"'.$ann["DBpediaURL"].'",';
                $response = $response.'"WikipediaURL":'.'"'.db2wiki($ann["DBpediaURL"],strtolower($data["lang"])).'",';
            }
            $response = $response.'"BabelNetURL":'.'"'.$ann["BabelNetURL"].'"}';
        }
        $response = $response."]";
        //echo gettype($c);
        echo '{"response":'.$response.'}';
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}



function Babelfy_only_named_entities_response($data){
    try {

        ///--- get
        $text_coded = rawurlencode($data["text"]);
        //$text_coded = "Obama";
        $qry_str = "?text=".$text_coded."&lang=EN&key=".$GLOBALS['APIKEY_BABELFY']."&annType=NAMED_ENTITIES";
        //echo $qry_str;
        $ch = curl_init();

        // Set query data here with the URL
        curl_setopt($ch, CURLOPT_URL, 'https://babelfy.io/v1/disambiguate' . $qry_str); 

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $content = trim(curl_exec($ch));
        if (curl_errno($ch)) {
            echo '{"error":"'.curl_error($ch).'"}';
            return false;
        }
        curl_close ($ch);
        
        if (gettype(strpos($content,"<html><head><title>"))!="boolean"){
            echo '{"error":"'.get_between($content,'<b>message</b> <u>','</u></p>').'"}';
            return false;
        }
        
        // processing json    var_dump
        $c =  json_decode($content,true);
        
        $response = "[";
        $first = true;
        foreach($c as $ann){
            //var_dump($ann);
            if ($first != true){
                $response = $response.",";
            }
            $first = false;
            $response = $response.'{"ini":'.$ann["charFragment"]["start"].",";
            $response = $response.'"fin":'.$ann["charFragment"]["end"].",";
            if ($ann["DBpediaURL"]){
                $response = $response.'"DBpediaURL":'.'"'.$ann["DBpediaURL"].'",';
                $response = $response.'"WikipediaURL":'.'"'.db2wiki($ann["DBpediaURL"],strtolower($data["lang"])).'",';
            }
            $response = $response.'"BabelNetURL":'.'"'.$ann["BabelNetURL"].'"}';
        }
        $response = $response."]";
        //echo gettype($c);
        echo '{"response":'.$response.'}';
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}



//equal to the previous function, but, taking into account the second search starting in the end of the first.
function get_between($tt, $t1, $t2){

    $start = strpos($tt, $t1);
    $nt1 = strlen($t1);
    if ($start!=false){
        if ($t2 == false){            
            return substr($tt, $start + $nt1);
        }
        else{
            $tt2 = substr($tt, $start + $nt1);
            $end = strpos($tt2, $t2) + $start + $nt1;
            if ($end!=false){
                return substr($tt, $start + $nt1 , $end - $start - $nt1);
            }
        }
    }
    return false;
}

// start searching from an specific position
function find_from_position($text,$s,$pos){
    $new_text = substr($text,$pos);
    $p = strpos($new_text,$s);
    if ($p != false){
        return $p;
    }
    return false;
}



function DBpedia_Spotlight_response($data){  
    try {
        ///--- get
        // http://model.dbpedia-spotlight.org/en/annotate?text=Barack%20Obama
        $original_text = $data["text"];
        $text_coded = rawurlencode($original_text);
        $qry_str = "?text=".$text_coded;
        $ch = curl_init();

        // Set query data here with the URL
        curl_setopt($ch, CURLOPT_URL, 'http://model.dbpedia-spotlight.org/en/annotate' . $qry_str); 

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $content = trim(curl_exec($ch));
        if (curl_errno($ch)) {
            echo '{"error":"'.curl_error($ch).'"}';
            return false;
        }

        curl_close($ch);
        
        //echo $content;
        if (gettype(strpos($content,"<html><head>"))!="boolean"){
            echo '{"error":"'.get_between($content,'<p>','<br />').'"}';
            return false;
        }
        
        $text  = get_between($content,"<body>\n<div>","</div>\n</body>");
        
        $ini = strpos($text, "<a href");
        $fin = strpos($text, "</a>");
        $pos = 0;
        $response = "[";
        $first = true;
        
        $overall = 0;
        while ($ini != false){            
            $txt = substr($text, $ini,$fin - $ini);
            $label = get_between($txt, '">', false);
            
            if ($first != true){
                $response = $response.",";
            }
            $first = false;
            $pp = find_from_position($original_text,$label,$overall);
            $dburl = get_between($txt,'href="','" title');
            $response = $response.'{"ini":'.strval($overall+$pp).",";
            $response = $response.'"fin":'.strval($overall+$pp + strlen($label)-1).",";
            $response = $response.'"WikipediaURL":'.'"'.db2wiki($dburl,strtolower($data["lang"])).'",';
            $response = $response.'"DBpediaURL":'.'"'.$dburl.'"}';
            
            
            $overall = $overall + $pp + strlen($label);
            
            $pos = $pos+$ini + strlen($label);
            $text = substr($text,$fin+4);
            $ini = strpos($text, "<a href");
            $fin = strpos($text, "</a>");
        
        }
        $response = $response."]";

        echo '{"response":'.$response.'}';
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}



function Aida_response($data){
    try {
        $original_text = $data["text"];
        $text_coded = rawurlencode($original_text);
        
        // Generated by curl-to-PHP: http://incarnate.github.io/curl-to-php/
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, "https://gate.d5.mpi-inf.mpg.de/aida/service/disambiguate");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, "text=".$text_coded);
        curl_setopt($ch, CURLOPT_POST, 1);

        $headers = array();
        $headers[] = "Content-Type: application/x-www-form-urlencoded";
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $content = trim(curl_exec($ch));
        if (curl_errno($ch)) {
            echo '{"error":"'.curl_error($ch).'"}';
            return false;
        }
        curl_close ($ch);
        //echo $content;
        
        if (gettype(strpos($content,"<body><h2>"))!="boolean"){
            echo '{"error":"'.get_between($content,'<body><h2>','</h2>').'"}';
            return false;
        }
        
        $c =  json_decode($content,true);
    
        $response = "[";
        $first = true;
        foreach($c["allEntities"] as $ann){
            $url = $c["entityMetadata"][$ann]["url"];
            $ini = 0;
            $len = 0;
            foreach($c["mentions"] as $mnt){
                if ($mnt["bestEntity"]["kbIdentifier"] == $ann){
                    $ini = intval($mnt["offset"]);
                    $len = intval($mnt["length"])-1;
                    break;
                }
            }
            if ($first != true){
                $response = $response.",";
            }
            $first = false;
            $response = $response.'{"ini":'.strval($ini).",";
            $response = $response.'"fin":'.strval($ini+$len).",";
            $response = $response.'"WikipediaURL":'.'"'.rawurldecode($url).'",';
            $response = $response.'"YAGOid":'.'"'.$ann.'"}';
        }
        $response = $response."]";

        echo '{"response":'.$response.'}';
        
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}



function FREME_NER_response($data){
    try {
        $original_text = $data["text"];
        $text_coded = rawurlencode($original_text);
        
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, "https://api.freme-project.eu/current/e-entity/freme-ner/documents?language=en&dataset=dbpedia&mode=all");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $original_text);
        curl_setopt($ch, CURLOPT_POST, 1);

        $headers = array();
        $headers[] = "Content-Type: text/plain";
        $headers[] = "Accept: text/turtle";
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $content = trim(curl_exec($ch));
        if (curl_errno($ch)) {
            echo '{"error":"'.curl_error($ch).'"}';
        return false;
        }
        curl_close ($ch);
        //echo $content;
        
        if (gettype(strpos($content,'"exception":'))!="boolean"){
            echo '{"error":'.get_between($content,'"exception":','",').'"}';
            return false;
        }
        
        $text = $content;
        $pos = strpos($text, "anchorOf");
        $response = "[";
        $first = true;
        while ($pos != false){            
            $text = substr($text, $pos+8);
            $ini = get_between($text,'nif:beginIndex        "','"^^xsd:nonNegativeInteger');
            $fin = get_between($text,'nif:endIndex          "','"^^xsd:nonNegativeInteger');
            $dburl = get_between($text,'itsrdf:taIdentRef     <','>');
            if ($first != true){
                $response = $response.",";
            }
            $first = false;
            $response = $response.'{"ini":'.strval($ini).",";
            $response = $response.'"fin":'.strval($fin).",";
            $response = $response.'"WikipediaURL":'.'"'.db2wiki($dburl,strtolower($data["lang"])).'",';
            $response = $response.'"DBpediaURL":'.'"'.$dburl.'"}';
            
            $pos = strpos($text, "anchorOf");
        }
        $response = $response."]";

        echo '{"response":'.$response.'}';
        
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}

//curl -X GET "http://wit.istc.cnr.it/stlab-tools/fred?text=Barack%20Obama%20and%20Trump%20are%20US&wfd_profile=b&textannotation=nif" -H  "accept: application/rdf+xml" -H  "Authorization: Bearer XXXXXXX"
function FRED_response($data){
    try {
        $original_text = $data["text"];
        $text_coded = rawurlencode($original_text);
        
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, "http://wit.istc.cnr.it/stlab-tools/fred?text=".$text_coded."&wfd_profile=b&textannotation=nif");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

        $headers = array();
        $headers[] = "Accept: application/rdf+xml";
        $headers[] = $APIKEY_FRED;
        $headers[] = "Authorization: ".$GLOBALS['APIKEY_FRED'];
        
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $content = trim(curl_exec($ch));
        if (curl_errno($ch)) {
            echo '{"error":"'.curl_error($ch).'"}';
            return false;
        }
        curl_close ($ch);

        //echo $content;
        //echo "\n".gettype(strpos($content,"<ams:fault"))."\n";
        if (gettype(strpos($content,"<ams:fault"))!="boolean"){
            echo '{"error":"'.get_between($content,'<ams:message>','</ams:message>').'"}';
            return false;
        }
        //echo "\npos:".strval(strpos($content,"<ams:fault"))."\n";
        $text = $content;
        $textDescription = '<rdf:Description rdf:about="http://www.ontologydesignpatterns.org/ont/fred/domain.owl#offset';
        $pos = strpos($text, $textDescription);
        $response = "[";
        $first = true;
        while ($pos != false){     

            $text = substr($text, $pos+8);
            $tsubject = get_between($text,'#offset_','">');
            $lsubject = explode("_",$tsubject);
            $ini = $lsubject[0];
            $fin = intval($lsubject[1])-1;
            
            $pdesc = strpos($text,"</rdf:Description>");
            $pdenot= strpos($text,'denotes rdf:resource="');

            if ($pdenot == false){
                $text = substr($text,$pos+1);
                $pos = strpos($text, $textDescription);
                break; // because none of the remaining descriptions has uri.
            }
            if ($pdesc < $pdenot){
                $text = substr($text,$pos+1);
                $pos = strpos($text, $textDescription);
                continue; // only consider those that contains a triple with the preposition denotes, because those have the url 
            }

            $idann = get_between($text,'denotes rdf:resource="','"/>');

            if ($idann!=false){ 
                #there is a triple with this identifier as subject
                $detailsann = get_between($content,'<rdf:Description rdf:about="'.$idann.'">','</rdf:Description>');

                $sameAsText = '<owl:sameAs rdf:resource="';
                $dburl = get_between($detailsann, $sameAsText,'"/>');

                if ($dburl != ""){
                    if ($first != true){
                        $response = $response.",";
                    }
                    $first = false;
                    $response = $response.'{"ini":'.strval($ini).",";
                    $response = $response.'"fin":'.strval($fin).",";
                    $response = $response.'"WikipediaURL":'.'"'.db2wiki($dburl,strtolower($data["lang"])).'",';
                    $response = $response.'"DBpediaURL":'.'"'.$dburl.'"}';
                }
            }
            
            $text = substr($text,$pos+1);
            $pos = strpos($text, $textDescription);
        }
        $response = $response."]";

        echo '{"response":'.$response.'}';
        
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}


function words2wiki($words, $lang){
    $name = implode("_", explode(" ",ucwords($words)));
    return "https://en.wikipedia.org/wiki/".$name;
}

//https://tagme.d4science.org/tagme/tag?lang=en&gcube-token=xxxxx&text=Obama%20US
function Tagme2_response($data){

    ///--- get
    $text_coded = rawurlencode($data["text"]);
    $qry_str = "?text=".$text_coded."&lang=en&gcube-token=".$GLOBALS['APIKEY_TAGME2'];
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, 'https://tagme.d4science.org/tagme/tag' . $qry_str); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }

    curl_close($ch);
    //echo $content;
    if (gettype(strpos($content,"<b>message</b>"))!="boolean"){
        echo '{"error":"'.get_between($content,'<b>message</b>','\n').'"}';
        return false;
    }
    
    if (gettype(strpos($content,"Stacktrace:"))!="boolean"){
        echo '{"error":"'.substr($content,0,strpos($content,"\n")).'"}';
        return false;
    }
    
    // processing json    var_dump
    $c =  json_decode($content,true);
    
    $response = "[";
    $first = true;
    foreach($c["annotations"] as $ann){
        //var_dump($ann);
        if ($first != true){
            $response = $response.",";
        }
        $first = false;
        $response = $response.'{"ini":'.$ann["start"].",";
        $response = $response.'"fin":'.strval(intval($ann["end"])-1).",";
        if ($ann["title"]){
            $response = $response.'"WikipediaURL":'.'"'.words2wiki($ann["title"],strtolower($data["lang"])).'"}';
        }
    }
    $response = $response."]";
    echo '{"response":'.$response.'}';
    
}


function FOX_response($data){
    // https://github.com/dice-group/FOX/blob/master/documentation/requests.md
    $model = "";//&foxlight=org.aksw.fox.tools.ner.de.StanfordDE";
    if ($data["model"]!=""){
        $model = "&foxlight=".$model;
    }

    $json_url = "http://fox.cs.uni-paderborn.de:4444/fox?lang=en".$model;
    $json_string = "{'input': ".$data["text"].",'lang': 'en','type': 'text','task': 'ner','output': 'JSON-LD'}";

    $ch = curl_init( $json_url );
    $options = array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => array('Content-type: application/json') ,
        CURLOPT_POSTFIELDS => $json_string
    );
    curl_setopt_array( $ch, $options );
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }
    curl_close ($ch);
    //echo $content;


    $c =  json_decode($content,true);
        
    $response = "[";
    $first = true;
    foreach($c["@graph"] as $ann){
        //var_dump($ann);
        if ($ann["taIdentRef"]){
            if ($first != true){
                $response = $response.",";
            }
            $first = false;
            $response = $response.'{"ini":'.$ann["beginIndex"].",";
            $response = $response.'"fin":'.strval(intval($ann["endIndex"])-1).",";
            
            //var_dump($ann["taIdentRef"]);
            if (strpos($ann["taIdentRef"], "notinwiki") == false){
                $dburl = "http://dbpedia.org/resource/".substr($ann["taIdentRef"],4);
                $wikiurl = "https://en.wikipedia.org/wiki/".substr($ann["taIdentRef"],4);
                
                $response = $response.'"DBpediaURL":'.'"'.$dburl.'",';
                $response = $response.'"WikipediaURL":'.'"'.$wikiurl.'"}';
            }
            else{
                $response = $response.'"WikipediaURL":"https://en.wikipedia.org/wiki/NotInLexico"}';
            }
        }
    }
    $response = $response."]";
    echo '{"response":'.$response.'}';
}


function Nerd_response($data){
    $text = $data["text"];//'Barack Obama and Donald Trump are in US';
    $json_url = "nerd.eurecom.fr/api/document";

    $ch = curl_init( $json_url );
    $options = array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => array('Content-type: application/x-www-form-urlencoded') ,
        CURLOPT_POSTFIELDS => "text=".urlencode($text)."&key=". $GLOBALS['APIKEY_NERD']
    );
    curl_setopt_array( $ch, $options );
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }
    curl_close ($ch);
    
    //echo $content;
    
    $c =  json_decode($content,true);
    $id_document = $c["idDocument"];
    //echo "\n------------\nid:".$c["idDocument"]."\nPart2\n-------------\n";


    //--------------------------------------------------------------------------------------
    $json_url = "nerd.eurecom.fr/api/annotation";

    $ch = curl_init( $json_url );
    $service = $data["model"];//'combined';
    $options = array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => array('Content-type: application/x-www-form-urlencoded') ,
        CURLOPT_POSTFIELDS => "extractor=".$service."&idDocument=".$id_document."&timeout=10&key=".$GLOBALS['APIKEY_NERD']
    );
    curl_setopt_array( $ch, $options );
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }
    curl_close ($ch);
    $c =  json_decode($content,true);
    $idAnnotation = $c["idAnnotation"];
    //----------------------------------------------------------------------------------------

    $json_url = "nerd.eurecom.fr/api/entity?key=".$GLOBALS['APIKEY_NERD']."&idAnnotation=".$idAnnotation;

    //echo $qry_str;
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, $json_url); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }
    //echo $content;
    curl_close($ch);

    $c =  json_decode($content,true);
    $response = "[";
    $first = true;
    foreach($c as $ann){
        //var_dump($ann);
        if ($first != true){
            $response = $response.",";
        }
        $first = false;
        $response = $response.'{"ini":'.$ann["startChar"].",";
        $response = $response.'"fin":'.strval(intval($ann["endChar"])-1).",";
        $response = $response.'"WikipediaURL":'.'"'.$ann["uri"].'"}';
    }
    $response = $response."]";
    echo '{"response":'.$response.'}';
    /**/
}


/**/
//---
if (is_ajax()) {
    try {
        if (isset($_POST["values"]) && !empty($_POST["values"])) { //Checks if data value exists
            $data = $_POST["values"];            

            switch($data["name"]) { //Switch case for value of data
                case "Babelfy_only_named_entities": Babelfy_only_named_entities_response($data); break;
                case "Babelfy_with_concepts": Babelfy_with_concepts_response($data); break;
                case "DBpedia Spotlight": DBpedia_Spotlight_response($data); break;
                case "AIDA": Aida_response($data); break;
                case "FREME NER": FREME_NER_response($data); break;
                case "FRED": FRED_response($data); break;
                case "Tagme2": Tagme2_response($data); break;
                case "FOX": FOX_response($data); break;
                case "StanfordEN-FOX": FOX_response($data); break;
                case "BalieEN-FOX": FOX_response($data); break;
                case "OpenNLPEN-FOX": FOX_response($data); break;
                case "IllinoisExtendedEN-FOX": FOX_response($data); break;
                case "Nerd-combined": Nerd_response($data); break;
            }

        }
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}


?>


 
