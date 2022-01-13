const axios = require("axios");
const moment = require('moment');
const settings = require('./settings')

function SP() {
    let token = null;
    let token_type = null;
    let token_create_time = null; //eg. 2022-01-13 10:55:12am
    let token_valid_duration = null; //eg. 3600
    let sp_order_id = null;
    this.checkout = function (checkout_params, checkout_callback) {
        //  get token first
        axios.post(settings.token_url,
            {username: settings.merchant_username, password: settings.merchant_password})
            .then(function (response) {
                token = response.data.token;
                token_type = response.data.token_type;
                token_create_time = response.data.TokenCreateTime;
                token_valid_duration = response.data.expires_in;

                checkout_params.token = response.data.token;
                checkout_params.execute_url = response.data.execute_url;

                // now do the checkout
                axios.post(checkout_params.execute_url, {
                    prefix: settings.merchant_key_prefix,
                    token: token,
                    return_url: settings.checkout_return_url,
                    cancel_url: settings.checkout_cancel_url,
                    store_id: settings.merchant_store_id,
                    amount: checkout_params.amount,
                    order_id: checkout_params.order_id,
                    currency: checkout_params.currency || settings.merchant_default_currency,
                    customer_name: checkout_params.customer_name,
                    customer_address: checkout_params.customer_address,
                    customer_phone: checkout_params.customer_phone,
                    customer_city: checkout_params.customer_city,
                    customer_post_code: checkout_params.customer_post_code,
                    client_ip: checkout_params.client_ip
                }).then(function (response) {
                    sp_order_id = response.data.sp_order_id;
                    checkout_callback(response.data.checkout_url, response.data);
                }).catch(function (checkout_error) {
                    console.log(checkout_error);
                });
            }).catch(function (getToken_error) {
            console.log(getToken_error);
        });
    }

    this.verify = function (order_id, callback) {
        axios({
            method: 'post',
            url: settings.verification_url,
            headers: {'content-type': 'application/json', 'Authorization': token_type + ' ' + token},
            data: {order_id: order_id}
        })
            .then(function (response) {
                callback(response.data);
            })
            .catch(function (verify_error) {

            });
    }

    this.check_status = function (order_id, callback) {
        axios({
            method: 'post',
            url: settings.payment_status_url,
            headers: {'content-type': 'application/json', 'Authorization': token_type + ' ' + token},
            data: {order_id: order_id}
        })
            .then(function (response) {
                callback(response.data);
            })
            .catch(function (verify_error) {

            });
    };

    this.token_valid = function () {
        let create_time_obj = moment(token_create_time, 'YYYY-MM-DD hh:mm:ssa');
        let dur_seconds = moment().subtract(create_time_obj).format('ss');
        return dur_seconds < token_valid_duration;
    };
}

module.exports = function () {
    return new SP();
}
