const fs =  require('fs');
const crypto = require('crypto');

const files_path = "/var/node_js/epimessages/files/final/";
const files_path_tmp = "/var/node_js/epimessages/files/tmp/";


function move_tmp_file(current_name, new_name, callback){
    const current_path = files_path_tmp + current_name;
    const new_path = files_path + new_name;
    fs.rename(current_path, new_path, err =>{
        callback(err);
    });
}

function delete_tmp_file(file_name){
    const file_path = files_path_tmp + file_name;
    fs.unlink(file_path, ()=>{});
}
function delete_file(file_name){
    const file_path = files_path + file_name;
    fs.unlink(file_path, ()=>{});
}



function get_new_name_file(file_name, callback){
    let path = files_path_tmp + file_name;
    const split_name = file_name.split(".");
    const ext = "." + split_name[split_name.length - 1];
    read_file(path, (err, data)=>{
        if (err == null){
            const hash = crypto.createHash('sha256');
            var new_file_name = hash.update(data).digest('hex');
            callback(null, new_file_name + ext)
        }else{
            callback(err);
        }
    });
}


function read_file(path, callback){
    fs.readFile(path, (err, data)=>{
        callback(err, data);
    });
}

function exist_file(file_name, callback){
    fs.access(files_path + file_name, fs.constants.R_OK, err => {
        callback(err);
    })
}




module.exports = {
    files_path: files_path,
    files_path_tmp: files_path_tmp,

    move_tmp_file: move_tmp_file,
    delete_file: delete_file,
    delete_tmp_file: delete_tmp_file,
    exist_file: exist_file,
    get_new_name_file: get_new_name_file,
};
