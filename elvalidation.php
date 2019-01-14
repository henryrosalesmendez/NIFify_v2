<?php


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


function encode_uri($link){
    if (strpos($link, '%') != false){
        return $link;
    }
    $line = explode("/", $link);
    $n = sizeof($line)-1;
    $line[$n] = rawurlencode($line[$n]);
    return implode("/",$line);
}

function dencode_uri($link){
    if (strpos($link, '%') != false){
        return $link;
    }
    $line = explode("/", $link);
    $n = sizeof($line)-1;
    $line[$n] = rawurldecode($line[$n]);
    return implode("/",$line);
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


https://en.wikipedia.org/w/index.php?title=The_Silence_of_the_Sea&redirect=no

function redirect_link($link){
    $L = explode("/wiki/",$link);
    return $L[0]."/w/index.php?title=".$L[1]."&redirect=no";
}


function toWikipedia($uri){
    if (strpos($uri,"dbpedia")){
        list($_, $link) = explode("//", $uri);
        $res = "https://en.wikipedia.org/wiki/".end(explode("/",$link));
        return $res;
    }
    return $uri;
}


function analyze_wiki($link){
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, redirect_link($link)); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 50);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        //echo '{"error":"'.curl_error($ch).'"}';
        echo trim('{"response":{"valid": false,"redirect":false, "disambiguation":false}}');
        return false;
    }

    curl_close($ch);
    //echo $content;
    
    //valid
    $start = strpos($content, 'id="noarticletext"'); // Wikipedia
    if ($start != false){
        echo trim('{"response":{"valid": false,"redirect":false, "disambiguation":false}}');
        return "false";
    }    
    
    //redirect
    $start = strpos($content, '<span id="redirectsub">'); // Wikipedia
    if ($start != false){
        echo trim('{"response":{"valid": true,"redirect":true, "disambiguation":false}}');
        return "false";
    }
    
    
    //disambiguation
    $start = strpos($content, 'title="Category:Disambiguation pages"');
    if ($start != false){
        echo trim('{"response":{"valid": true,"redirect":false, "disambiguation":true}}');
        return "false";
    }
    
    //
    echo trim('{"response":{"valid": true,"redirect":false, "disambiguation":false}}');
    return "true";

}



function analyze_db($link){
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, $link); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 50);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        //echo '{"error":"'.curl_error($ch).'"}';
        echo trim('{"response":{"valid": false,"redirect":false, "disambiguation":false}}');
        return false;
    }

    curl_close($ch);
    //echo $content;
    
    //valid
    $start = strpos($content, '<p>No further information is available. (The requested entity is unknown)</p>');
    if ($start != false){
        echo trim('{"response":{"valid": false,"redirect":false, "disambiguation":false}}');
        return "false";
    }    
    
    //redirect
    $uri_ttl = $link;
    if (strpos($link, '/page/') != false){
        $uri_ttl = str_replace('/page/',"/data/",$link);
    }
    $uri_ttl = $uri_ttl.".ttl";
    //echo "encode:".$uri_ttl."\n";
    //echo "decode:".rawurldecode($uri_ttl)."\n";
    if( strpos($content, rawurldecode($uri_ttl)) == false ){ 
        echo trim('{"response":{"valid": true,"redirect":true, "disambiguation":false}}');
        return "false";
    }
        
    
    //disambiguation
    $start = strpos($content, 'rel="dbo:wikiPageDisambiguates"');
    if ($start != false){
        echo trim('{"response":{"valid": true,"redirect":false, "disambiguation":true}}');
        return "false";
    }
    
    //
    echo trim('{"response":{"valid": true,"redirect":false, "disambiguation":false}}');
    return "true";

}


if (is_ajax()) {
    try {
        if (isset($_POST["values"]) && !empty($_POST["values"])) { //Checks if data value exists
            $data = $_POST["values"];
            $uri = $data["uri"]; 
            
            if (strpos($uri, 'dbpedia.org/') != false){
                //echo "db\n";
                if (strpos($uri, 'dbpedia.org/resource/') != false){
                    $uri = str_replace('/resource/','/page/',$uri);
                }
                $uri = encode_uri($uri);
                $v = analyze_db($uri); 
            }
            
            if (strpos($uri, 'wikipedia.org/') != false){
                //echo "wiki\n";
                $uri = encode_uri($uri);
                $v = analyze_wiki($uri); 
            }         
        }
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}
?>


 
