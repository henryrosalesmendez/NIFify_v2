setIntersection = function(s1,s2){
    return new Set([...s1].filter(x => s2.has(x))); 
}


findbyUriDoc = function(uri,B){
    for (_a_i in B){
        var _a = B[_a_i];
        if (_a["uri"] == uri){
            return _a_i;
        }
    }
    return -1;
}


findIn = function(a,B){
    for (a_i_ in B){
        var a_ = B[a_i_];
        if (a_["ini"] == a["ini"] && a_["fin"] == a["fin"] && (setIntersection(a_["uri"],a["uri"])).size != 0){
            return a_i_;
        }
    }
    return -1;
}

isItProperName = function(_a_){
    var annot = A[_a_["idA"]];
    if (!("tag" in annot)){
        return false;
    }

    
    return ( annot["tag"].indexOf("mnt:FullMentionPN")!=-1 || annot["tag"].indexOf("mnt:ShortMentionPN")!=-1 || annot["tag"].indexOf("mnt:ExtendedMentionPN")!=-1);
}

findIn_strict = function(a,B){
    var bTags = isItProperName(a);
    if (bTags == false){
        return -1;
    }
    for (a_index in B){
        var a_A = B[a_index];
        if (a_A["ini"] == a["ini"] && a_A["fin"] == a["fin"]  && 
            (setIntersection(a_A["uri"],a["uri"])).size != 0){
            return a_index;
        }
    }
    return -1;
}


tagAnn = function(cand,p,type_a,name_measure){
    var idA = cand[p]["idA"];
    
    if (!("measures" in sysA[idA])){
        sysA[idA]["measures"] = {};
    }
    
    for (nm_i in name_measure){
        var nm = name_measure[nm_i];
        if (name_measure in sysA[idA]){
            if (sysA[idA]["measures"][nm].indexOf(type_a) == -1){
                sysA[idA]["measures"][nm].push(type_a);
            }
            
        }
        else {
            sysA[idA]["measures"][nm] = [type_a];
        }
    }    
}


contingencyTable_strict = function(cand,gold,name_measure){
    var tp = 0;
    var fp = 0;
    var fn = 0;
    
    var candidate = [];
    for (var c_ii in cand){
        candidate.push(cand[c_ii]);
    }
    
    for (var g_i in gold){
        var g = gold[g_i];
        var p = findIn_strict(g,candidate);
        if (p == -1){
            fn = fn + 1;            
        }
        else{
            tp = tp + 1;
            tagAnn(candidate,p,"tax:tp",name_measure);
            candidate.splice(p,1);
        }
    }
    fp = candidate.length; // because I was erase the tp of candidate, this is |cand| - tp
    
    for (var fp_i in candidate){
        tagAnn(candidate,fp_i,"tax:fp",name_measure);
    }
    
    return {"tp":tp,"fp":fp, "fn":fn};
}


contingencyTable = function(cand,gold,name_measure){
    var tp = 0;
    var fp = 0;
    var fn = 0;
    
    var candidate = [];
    for (var c_ii in cand){
        candidate.push(cand[c_ii]);
    }
    
    for (var g_i in gold){
        var g = gold[g_i];
    
        var p = findIn(g,candidate);
        if (p == -1){
            fn = fn + 1;
        }
        else{
            tp = tp + 1;
            tagAnn(candidate,p,"tax:tp",name_measure);
            candidate.splice(p,1);
        }
    }
    fp = candidate.length; // because I was erase the tp of candidate, this is |cand| - tp
    
    for (var fp_i in candidate){
        tagAnn(candidate,fp_i,"tax:fp",name_measure);
    }
    
    return {"tp":tp,"fp":fp, "fn":fn};
}

precision = function(tp,fp){
    return (((tp + fp)==0)?0:tp/(tp+fp));
}

recall = function(tp,fn){
    return (((tp + fn)==0)?0:tp/(tp+fn));
}

harmonicMean = function(P,R){
    if (P+R == 0){
        return 0;
    }
    return 2*(P*R)/(P+R);
}


microF1Measure = function(candidate, gold){
    var sum_tp = 0;
    var sum_fp = 0;
    var sum_fn = 0;
    
    
    for (var c_i_ in candidate){
        var c_ = candidate[c_i_];
        var pg = findbyUriDoc(c_["uri"],gold);
        if ( pg!=-1){
            var g_ = gold[pg];
            var ct = contingencyTable(c_,g_,["microF1"]);

            sum_tp = sum_tp + ct["tp"];
            sum_fp = sum_fp + ct["fp"];
            sum_fn = sum_fn + ct["fn"];
        }
    }
    
    p = precision(sum_tp,sum_fp);
    r = recall(sum_tp,sum_fn);
    f = harmonicMean(p,r)
    
    return [{"name":"microF1",
            "finals_scores":{1:{"name":"microF1", "score":parseFloat(f).toFixed(2)}, 
                             2:{"name":"microPrecision", "score":parseFloat(p).toFixed(2)},
                             3:{"name":"microRecall", "score":parseFloat(r).toFixed(2)}
                            }}];
} 





microF1Measure_two_way = function(candidate, gold){
    
    //relax
    var sum_tp_r = 0;
    var sum_fp_r = 0;
    var sum_fn_r = 0;
    
    
    for (var c_i_ in candidate){
        var c_ = candidate[c_i_];
        var pg = findbyUriDoc(c_["uri"],gold);
        if ( pg!=-1){
            var g_ = gold[pg];
            var ct = contingencyTable(c_,g_,["microF1Measure_p_rel__r_stc","microF1Measure_p_stc__r_rel"]);

            sum_tp_r = sum_tp_r + ct["tp"];
            sum_fp_r = sum_fp_r + ct["fp"];
            sum_fn_r = sum_fn_r + ct["fn"];
        }
    }
    
    var p_r = precision(sum_tp_r,sum_fp_r);
    var r_r = recall(sum_tp_r,sum_fn_r);
    
    
    //strict
    var sum_tp_s = 0;
    var sum_fp_s = 0;
    var sum_fn_s = 0;
    
    
    for (var c_i_ in candidate){
        var c_ = candidate[c_i_];
        var pg = findbyUriDoc(c_["uri"],gold);
        if ( pg!=-1){
            var g_ = gold[pg];
            var ct = contingencyTable_strict(c_,g_,["microF1Measure_p_rel__r_stc","microF1Measure_p_stc__r_rel"]);
            sum_tp_s = sum_tp_s + ct["tp"];
            sum_fp_s = sum_fp_s + ct["fp"];
            sum_fn_s = sum_fn_s + ct["fn"];
        }
    }
    
    //--- 
    var p_s = precision(sum_tp_s,sum_fp_s);
    var r_s = recall(sum_tp_s,sum_fn_s);
    
    //--
    var f_p_rel__r_stc = harmonicMean(p_r,r_s);
    var f_p_stc__r_rel = harmonicMean(p_s,r_r);
    return [
    
    {"name":"microF1Measure_p_rel__r_stc",
            "finals_scores":{1:{"name":"microF1Measure_p_rel__r_stc", "score":parseFloat(f_p_rel__r_stc).toFixed(2)}, 
                             2:{"name":"microPrecision_relax", "score":parseFloat(p_r).toFixed(2)},
                             3:{"name":"microRecall_strict", "score":parseFloat(r_s).toFixed(2)}
                            }},                            
    {"name":"microF1Measure_p_stc__r_rel",
            "finals_scores":{1:{"name":"microF1Measure_p_stc__r_rel", "score":parseFloat(f_p_stc__r_rel).toFixed(2)}, 
                             2:{"name":"microPrecision_strict", "score":parseFloat(p_s).toFixed(2)},
                             3:{"name":"microRecall_relax", "score":parseFloat(r_r).toFixed(2)}
                            }},
    ];
} 




macroF1Measure = function(candidate, gold){
    var p = 0;
    var r = 0;
    
    for (var c_i_ in candidate){
        var c_ = candidate[c_i_];
        var pg = findbyUriDoc(c_["uri"],gold);
        if ( pg!=-1){
            var g_ = gold[pg];
            var ct = contingencyTable(c_,g_,["macroF1"]);
            p = p + precision(ct["tp"],ct["fp"]);
            r = r + recall(ct["tp"],ct["fn"]);
        }
    }

    f = harmonicMean(p/D.length,r/D.length);
    
    return [{"name":"macroF1",
            "finals_scores":{1:{"name":"macroF1", "score":parseFloat(f).toFixed(2)}, 
                             2:{"name":"macroPrecision", "score":parseFloat(p).toFixed(2)},
                             3:{"name":"macroRecall", "score":parseFloat(r).toFixed(2)}
                            }}];
}



