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


function isRedirect($link){
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, redirect_link($link)); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        echo '{"error":"'.curl_error($ch).'"}';
        return false;
    }

    curl_close($ch);
    //echo $content;
    $start = strpos($content, '<span id="redirectsub">');
    if ($start != false){
        return "true";
    }
    return "false";
}



function isDisambiguation($link){
    $ch = curl_init();

    // Set query data here with the URL
    curl_setopt($ch, CURLOPT_URL, $link); 

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        echo '{"error":"'.curl_error($ch).'"}';
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $content = trim(curl_exec($ch));
    if (curl_errno($ch)) {
        //echo '{"error":"'.curl_error($ch).'"}';
        echo trim('{"response":{"valid": false,"redirect":false, "disambiguation":false}}');
        return false;
    }

    curl_close($ch);
    //echo $content;
    $start = strpos($content, '<b>Wikipedia does not have an article with this exact name.</b>');
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


 
