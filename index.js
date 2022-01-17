const axios = require('axios');
const moment = require('moment');

function randomString(length){
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

function SP(){
    const _this = this;

    this.session = null;

    this.settings = require('./settings');

    this.randomString = randomString;

    this.configure_merchant = function (merchant_username, merchant_password, merchant_store_id, merchant_key_prefix, merchant_default_currency){
        this.settings.merchant_username = merchant_username;
        this.settings.merchant_password = merchant_password;
        this.settings.merchant_store_id = merchant_store_id;
        this.settings.merchant_key_prefix = merchant_key_prefix;
        this.settings.merchant_default_currency = merchant_default_currency;
    };

    this.gettoken_error_handler = function (error_message){
    };
    this.checkout_error_handler = function (error_message){
    };

    this.checkout_callback = function (checkout_url, response_data){
    };

    this.checkout = function (checkout_params){
        //  get token first
        axios.post(this.settings.token_url,
            { username: this.settings.merchant_username, password: this.settings.merchant_password })
            .then(function (response){
                _this.session.sp_token = {
                    token: response.data.token,
                    token_type: response.data.token_type,
                    token_create_time: response.data.TokenCreateTime, //eg. 2022-01-13 10:55:12am
                    token_valid_duration: response.data.expires_in ////eg. 3600
                };

                checkout_params.token = response.data.token;
                checkout_params.execute_url = response.data.execute_url;

                // now do the checkout
                axios.post(checkout_params.execute_url, {
                    prefix: _this.settings.merchant_key_prefix,
                    token: _this.session.sp_token.token,
                    return_url: _this.settings.checkout_return_url,
                    cancel_url: _this.settings.checkout_cancel_url,
                    store_id: _this.settings.merchant_store_id,
                    amount: checkout_params.amount,
                    order_id: checkout_params.order_id,
                    currency: checkout_params.currency || _this.settings.merchant_default_currency,
                    customer_name: checkout_params.customer_name,
                    customer_address: checkout_params.customer_address,
                    customer_phone: checkout_params.customer_phone,
                    customer_city: checkout_params.customer_city,
                    customer_post_code: checkout_params.customer_post_code,
                    client_ip: checkout_params.client_ip
                }).then(function (response){
                    _this.checkout_callback(response.data.checkout_url, response.data);
                }).catch(function (checkout_error){
                    _this.checkout_error_handler(checkout_error);
                });
            }).catch(function (getToken_error){
            _this.gettoken_error_handler(getToken_error);
        });
    };

    this.verify = function (order_id, callback){
        axios({
            method: 'post',
            url: this.settings.verification_url,
            headers: { 'content-type': 'application/json', 'Authorization': _this.session.sp_token.token_type + ' ' + _this.session.sp_token.token },
            data: { order_id: order_id }
        })
            .then(function (response){
                callback(response.data);
            })
            .catch(function (verify_error){

            });
    };

    this.check_status = function (order_id, callback){
        axios({
            method: 'post',
            url: this.settings.payment_status_url,
            headers: { 'content-type': 'application/json', 'Authorization': _this.session.sp_token.token_type + ' ' + _this.session.sp_token.token },
            data: { order_id: order_id }
        })
            .then(function (response){
                callback(response.data);
            })
            .catch(function (verify_error){

            });
    };

    this.token_valid = function (){
        let create_time_obj = moment(_this.session.sp_token.token_create_time, 'YYYY-MM-DD hh:mm:ssa');
        let dur_seconds = moment().subtract(create_time_obj).format('ss');
        return dur_seconds < _this.session.sp_token.token_valid_duration;
    };
}

module.exports = function (){
    // create a payment handler object instance
    return new SP();
};
