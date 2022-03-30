    
let emoji_json;
let emoji_json_keys;
$.get( "/emoji", data =>{
     emoji_json = data;
     emoji_json_keys = Object.keys(emoji_json);
});


function replaceAll(emoji_shortcut, emoji, str){
    let index = str.indexOf(emoji_shortcut);
    while (index != -1){
        let last_index = index;
        if (index-1 < 0 || str[index-1] == " "){
            if (index+emoji_shortcut.length >= str.length || str[index+emoji_shortcut.length] == " "){
                str = str.substring(0,index) + emoji + str.substring(index+emoji_shortcut.length);
                index = str.substring(index + 1).indexOf(emoji_shortcut);
                if (index != -1){
                    index += last_index + 1;
                }
            }else{
                index = str.substring(index+emoji_shortcut.length).indexOf(emoji_shortcut);
                if (index != -1){
                    index += last_index + emoji_shortcut.length;
                }
            }
        }else{
            index = str.substring(index+emoji_shortcut.length).indexOf(emoji_shortcut);
            if (index != -1){
                index += last_index + emoji_shortcut.length;
            }
        }
    }
    return str;
}


const emoji_lib = {

    get_json: () => {return emoji_json},
    get_codes: () => {return emoji_json_keys},
    find: (str) => {
        const result = fuzzysort.go(str, emoji_json_keys);
        return result.map(fuzzy_item => fuzzy_item.target);
    },

    get: (code) => {
        return emoji_json[code];
    },

    exists: (str) => {
        return emoji_json_keys.includes(str);
    },

    emojify: (str)=>{
        str = replaceAll(":)", emoji_json["slightly_smiling_face"], str);
        str = replaceAll("(:", emoji_json["upside_down_face"], str);
        str = replaceAll(":(", emoji_json["slightly_frowning_face"], str);
        str = replaceAll(":D", emoji_json["smile"], str);
        str = replaceAll(":O", emoji_json["open_mouth"], str);
        str = replaceAll(":o", emoji_json["open_mouth"], str);
        str = replaceAll(":|", emoji_json["neutral_face"], str);
        str = replaceAll(";(", emoji_json["sob"], str);
        str = replaceAll(":'(", emoji_json["disappointed_relieved"], str);
        str = replaceAll(":,(", emoji_json["disappointed_relieved"], str);
        str = replaceAll(">:(", emoji_json["angry"], str);
        str = replaceAll(":p", emoji_json["stuck_out_tongue"], str);
        str = replaceAll(":P", emoji_json["stuck_out_tongue"], str);
        str = replaceAll(",:)", emoji_json["sweat_smile"], str);
        str = replaceAll(":$", emoji_json["unamused"], str);
        str = replaceAll(":@", emoji_json["rage"], str);
        str = replaceAll("<3", emoji_json["heart"], str);
        str = replaceAll(";)", emoji_json["wink"], str);
        str = replaceAll("xD", emoji_json["joy"], str);
        str = replaceAll("XD", emoji_json["joy"], str);
        str = replaceAll("Adrien", emoji_json["poop"], str);
        str = replaceAll("adrien", emoji_json["poop"], str);
        str = replaceAll("Cambon", emoji_json["bulb"], str);
        str = replaceAll("CAMBON", emoji_json["bulb"], str);
        str = replaceAll("cambon", emoji_json["bulb"], str);
        str = replaceAll("Pierre", emoji_json["mountain"], str);
        str = replaceAll("pierre", emoji_json["mountain"], str);
        return str;
    },

}
