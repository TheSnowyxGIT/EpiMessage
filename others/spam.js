class SPAM {
    constructor() {
      this.MAX_MSGS_PER_SECONDS = 4;
      this.interval_time = 2000;
      this.users_count = {2: 0};
      this.interval = setInterval(()=>{this.reset();}, this.interval_time);
    }

    is_allow_to_send(user_id){
        if (this.users_count[user_id] < Math.floor(this.interval_time * this.MAX_MSGS_PER_SECONDS / 1000)){
            return true;
        }
        return false;
    }

    user_sent(user_id){
        this.users_count[user_id] += 1;
    }

    addUser(user_id){
        this.users_count[user_id] = 0;
    }

    removeUser(user_id){
        delete this.users_count[user_id];
    }

    reset() {
        for (const key of Object.keys(this.users_count)) {
            this.users_count[key] = 0;
          }
    }

}

module.exports = new SPAM();