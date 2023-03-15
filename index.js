const axios = require('axios');
const moment = require('moment');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});
const logger = createLogger({
    format: combine(
        label({ label: 'shurjopaynode' }),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'shurjopaynode.log' })
    ]
});

function randomString(length){
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

function SP(){
    const _this = this;

    this.data = {};

    this.settings = require('./settings');

    this.randomString = randomString;

    this.log = (message, level) => {
        logger.log({
            level: level,
            message: message
        });
    };

    this.is_live = function () {
        this.settings.sandbox = false;
        return true;
    };

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

    this.getToken = function (callback){
        //  get token first
        axios.post(this.settings.token_url,
            { username: this.settings.merchant_username, password: this.settings.merchant_password })
            .then(function (response){
                _this.data.sp_token = {
                    token: response.data.token,
                    token_type: response.data.token_type,
                    token_create_time: response.data.TokenCreateTime, //eg. 2022-01-13 10:55:12am
                    token_valid_duration: response.data.expires_in ////eg. 3600
                };
                callback(response.data, response.data.token, response.data.token_type, response.data.TokenCreateTime, response.data.expires_in);
            }).catch(function (getToken_error){
            _this.gettoken_error_handler(getToken_error);
        });
    };

    this.checkout = function (checkout_params, checkout_callback){
        this.getToken((data, token) => {
            axios.post(data.execute_url, {
                prefix: _this.settings.merchant_key_prefix,
                store_id: _this.settings.merchant_store_id,
                token: token,
                return_url: checkout_params.return_url,
                cancel_url: checkout_params.cancel_url,
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
                checkout_callback(response.data, response.data.checkout_url);
            }).catch(function (checkout_error){
                _this.checkout_error_handler(checkout_error);
            });
        });
    };

    this.verify = function (order_id, callback, error_handler){
        this.getToken((data, token, token_type) => {
            axios({
                method: 'post',
                url: this.settings.verification_url,
                headers: { 'content-type': 'application/json', 'Authorization': token_type + ' ' + token },
                data: { order_id: order_id }
            })
                .then(function (response){
                    callback(response.data);
                })
                .catch(function (verify_error){
                    error_handler(verify_error);
                });
        });
    };

    this.check_status = function (order_id, callback, error_handler){
        this.getToken((data, token, token_type) => {
            axios({
                method: 'post',
                url: this.settings.payment_status_url,
                headers: { 'content-type': 'application/json', 'Authorization': token_type + ' ' + token },
                data: { order_id: order_id }
            })
                .then(function (response){
                    callback(response.data);
                })
                .catch(function (verify_error){
                    error_handler(verify_error);
                });
        });
    };

    this.token_valid = function (){
        let create_time_obj = moment(_this.data.sp_token.token_create_time, 'YYYY-MM-DD hh:mm:ssa');
        let dur_seconds = moment().subtract(create_time_obj).format('ss');
        return dur_seconds < _this.data.sp_token.token_valid_duration;
    };
}

module.exports = function (){
    // create a payment handler object instance
    return new SP();
};
