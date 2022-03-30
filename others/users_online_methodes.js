module.exports = {


    get_online_users: (users_sokect) => {
        return Object.keys(users_sokect).map(e => parseInt(e));
    }


}