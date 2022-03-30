const code = {
    AUTO: 0,
    DISCONNECTED: 1,
    INIT_DATA_JOIN: 2,
    SENDING_WRONG_DATA: 3,
    LOADING_PRIVATE_MSGS: 4,
    SENDING_PRIVATE_MSGS: 5,
    UNKNOWN_MSG_TYPE: 6,
    WRITING_FILE: 7,
    READING_FILE: 8,
    HASH_FILE: 9,
    UPLOAD_FILE: 10,
    MOVING_RENAMING_FILE: 11,
    INSERT_PERMISSIONS: 12,
    UPLOAD_MAX_SIZE: 13,
    UNKNOWN_CHANNEL_TYPE: 14,
    ACCESS_GROUP_PERMISSIONS: 15,
    GET_MIME_OF_FILE: 16,
    FILE_TYPE_INCORRECT: 17,
    SPAM: 18,
    DATA_INCORRECT:19,
}

function get_error(_code, e = null){

    let err = "";
    if (_code == code.AUTO){
        err = JSON.stringify(e);
    }else if (_code == code.DISCONNECTED){
        err = `Vous n'êtes plus connecté à Epinotes. Vous allez être redirigé vers la page de connexion...`;
    }
    else if (_code == code.INIT_DATA_JOIN){
        err = `Erreur lors de l'initialisation de la base de données.`;
    }
    else if (_code == code.SENDING_WRONG_DATA){
        err = `Les données envoyées sont incorrectes.`;
    }
    else if (_code == code.LOADING_PRIVATE_MSGS){
        err = `Erreur lors du chargement des messages dans la base de données.`;
    }
    else if (_code == code.SENDING_PRIVATE_MSGS){
        err = `Erreur lors de l'envoi du message dans la base de donnees.`;
    }
    else if (_code == code.UNKNOWN_MSG_TYPE){
        err = `Type de fichier non géré : ${e.mime_type}.`;
    }
    else if (_code == code.HASH_FILE){
        err = `Erreur lors du hachage du fichier.`;
    }
    else if (_code == code.UPLOAD_FILE){
        err = `Erreur lors de l'envoi du fichier. Erreur : ${e.upload_error}.`;
    }
    else if (_code == code.MOVING_RENAMING_FILE){
        err = `Erreur lors du déplacement du fichier vers le dossier permanent.`;
    }
    else if (_code == code.UPLOAD_MAX_SIZE){
        err = `Envoi du fichier impossible, la taille maximale d'un fichier est ${(e.upload_max_size)/1000000}Mo. Votre fichier fait ${((e.upload_file_size)/1000000).toFixed(2)}Mo.`;
    }
    else if (_code == code.INSERT_PERMISSIONS){
        err = `Erreur lors de mise en place des permissions du fichier.`;
    }
    else if (_code == code.UNKNOWN_CHANNEL_TYPE){
        err = `Type de channel inconnu : ${e.type}.`;
    }
    else if (_code == code.ACCESS_GROUP_PERMISSIONS){
        err = `Vous n'avez pas accès au groupe d'id : ${e.group_id}.`;
    }
    else if (_code == code.GET_MIME_OF_FILE){
        err = `Erreur lors de l'obtention du mime du fichier.`;
    }
    else if (_code == code.FILE_TYPE_INCORRECT){
        err = `Le type du fichier envoyé est interdit. Type(s) autorisé(s) : ${e.types.join(", ")}`;
    }
    else if (_code == code.SPAM){
        err = `Tu veux des baffes à envoyer tous ces messages ?! :(`;
    }
    else if (_code == code.DATA_INCORRECT){
        err = `Données incorrectes :(`;
    }
    else{
        err = `Erreur serveur inconnue ou non prise en charge.`;
    }
    return err;
}


module.exports = {
    get_error: get_error,
    code: code
}