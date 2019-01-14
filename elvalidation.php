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


function isRedirect($link){
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, redirect_link(toWikipedia($link))); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 100);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        //echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }

    curl_close($ch);
    $start = false;
    if (strpos($link, 'wikipedia.org/') != false){
        $start = strpos($content, '<span id="redirectsub">'); // Wikipedia
    }
    
    if ($start == false && strpos($link, 'dbpedia.org/') != false){ // DBpedia
        $uri_ttl = $link;
        if (strpos($link, '/page/') != false){
            $uri_ttl = str_replace('/page/',"/data/",$link).".ttl";
        }
 
        if( strpos($content, $uri_ttl) != false ){ 
            return "false";
        }
    }
    if ($start != false){
        return "true";
    }
    return "false";
}



function isDisambiguation($link){
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, toWikipedia($link)); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 100);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        //echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }

    curl_close($ch);
    //echo $content;
    $start = strpos($content, 'title="Category:Disambiguation pages"');
    if ($start != false){
        return "true";
    }
    return "false";    
}



function isValid($link){
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, $link); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 100);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        //echo '{"error":"'.curl_error($ch).'"}';
        echo trim('{"response":{"valid": false,"redirect":false, "disambiguation":false}}');
        return false;
    }

    curl_close($ch);
    //echo $content;
    $start = strpos($content, 'id="noarticletext"'); // Wikipedia
    if ($start == false){
        $start = strpos($content, '<p>No further information is available. (The requested entity is unknown)</p>'); // DBpedia
    }
    
    if ($start != false){
        return "false";
    }
    return "true";
}

    

if (is_ajax()) {
    try {
        if (isset($_POST["values"]) && !empty($_POST["values"])) { //Checks if data value exists
            $data = $_POST["values"];
            $uri = $data["uri"]; 
            
            if (strpos($uri, 'dbpedia.org/resource/') != false){
                $uri = str_replace('/resource/','/page/',$uri);
            }
            
            $uri = encode_uri($uri);
            $v = isValid($uri);
            if ($v != false){
                if ($v == "false"){
                    echo trim('{"response":{"valid": false,"redirect":false, "disambiguation":false}}');
                }
                else{
                    $d = isDisambiguation($uri);
                    if ($d != false){
                        $r = isRedirect($uri);                    
                        if ($r != false){
                            echo trim('{"response":{"valid":'.$v.',"redirect":'.$r.', "disambiguation":'.$d.'}}');
                        }
                    }
                }                
            }            
        }
    } catch (Exception $e) {
        echo '{"error":'.$e->getMessage().'}';
    }
}
?>


 
