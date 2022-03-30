module.exports = {

    check_textmsg: (data) =>{
        // data type already verif
        // data channel_type already verif
        if (!data.message_body || typeof data.message_body != "string" || data.message_body == ""){
            return false;
        }

        if (data.id_receiver){
            if (typeof data.id_receiver != "number" || data.id_receiver < 0){
                return false;
            }
            return true;
        }else if (data.group_id){
            if (typeof data.group_id != "number" || data.group_id < 0){
                return false;
            }
            return true;
        }else{
            return false;
        }
        return true;
    },

    check_askmsg_private: (data) =>{
        if (!data.user || typeof data.user != "number" || data.user < 0){
            return false;
        }
        return true;
    },

    check_askmsg_group: (data) =>{
        if (!data.group_id || typeof data.group_id != "number" || data.group_id < 0){
            return false;
        }
        return true;
    }

}